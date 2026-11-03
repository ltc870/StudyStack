#Requires -Version 7.0
<#
.SYNOPSIS
    Tests the substack endpoints of the StudyStack API: the normal paths, and
    that every request touching another user's data (or a substack from a
    different stack) is refused without changing anything.

.DESCRIPTION
    Logs in as two users, creates throwaway stacks, substacks and cards for
    each (names start with "zz-substack-test"), runs every case, then deletes
    everything it created. Existing stacks and cards are never touched.

    After each refused request, the script reads both users' test data back
    through the API and checks that nothing changed.

    Prints one PASS or FAIL line per check and a summary. Exits with 1 if any
    check failed. Never prints passwords or tokens.

.PARAMETER BaseUrl
    The app's address, for example https://localhost:7285 (the API's https
    profile) or https://studystack-test.tail63e067.ts.net. Never production.

.PARAMETER UserA
    The first user (default lawrence). Most requests are made as this user.

.PARAMETER UserB
    The second user (default travis), whose data user A must not reach.

.PARAMETER SkipCertificateCheck
    Accept an untrusted certificate. Only allowed for https://localhost, in case
    the .NET development certificate isn't trusted.

.EXAMPLE
    ops/test-substacks-api.ps1 -BaseUrl https://localhost:7285
#>
param(
    [Parameter(Mandatory)]
    [string]$BaseUrl,
    [string]$UserA = 'lawrence',
    [string]$UserB = 'travis',
    [switch]$SkipCertificateCheck
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')

if ($BaseUrl -match '^https://studystack\.') {
    throw "Refusing to run against production ($BaseUrl). Use the test environment or localhost."
}
if ($SkipCertificateCheck -and $BaseUrl -notmatch '^https://localhost(:\d+)?$') {
    throw '-SkipCertificateCheck is only allowed for https://localhost.'
}

$script:Results = [System.Collections.Generic.List[object]]::new()
$script:CreatedStacks = [System.Collections.Generic.List[object]]::new()
$Prefix = 'zz-substack-test'
$MissingId = 2147480000   # an id no table will reach

# ---------------------------------------------------------------- helpers

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Token,
        [object]$Body,
        [switch]$RawBody
    )
    $parameters = @{
        Method             = $Method
        Uri                = "$BaseUrl$Path"
        SkipHttpErrorCheck = $true
        ContentType        = 'application/json'
    }
    if ($Token) { $parameters.Headers = @{ Authorization = "Bearer $Token" } }
    if ($null -ne $Body) {
        $parameters.Body = if ($RawBody) { $Body } else { ConvertTo-Json -InputObject $Body -Depth 5 -Compress }
    }
    if ($SkipCertificateCheck) { $parameters.SkipCertificateCheck = $true }

    $response = Invoke-WebRequest @parameters
    $content = $null
    if ($response.Content -and "$($response.Headers['Content-Type'])" -match 'json') {
        $content = $response.Content | ConvertFrom-Json -NoEnumerate
    }
    [pscustomobject]@{ Status = [int]$response.StatusCode; Body = $content }
}

function Add-Result {
    param([string]$Name, [bool]$Passed, [string]$Detail = '')
    $script:Results.Add([pscustomobject]@{ Name = $Name; Passed = $Passed })
    if ($Passed) {
        Write-Host "PASS  $Name" -ForegroundColor Green
    } else {
        Write-Host "FAIL  $Name  $Detail" -ForegroundColor Red
    }
}

function Assert-Status {
    param([string]$Name, [int]$Expected, [object]$Response)
    Add-Result $Name ($Response.Status -eq $Expected) "(expected $Expected, got $($Response.Status))"
}

function Assert-True {
    param([string]$Name, [bool]$Condition, [string]$Detail = '')
    Add-Result $Name $Condition $Detail
}

function Get-Token {
    param([string]$Username)
    $secure = Read-Host "Password for $Username" -AsSecureString
    $plain = ConvertFrom-SecureString -SecureString $secure -AsPlainText
    $response = Invoke-Api POST '/api/Auth/login' -Body @{ username = $Username; password = $plain }
    $plain = $null
    if ($response.Status -ne 200 -or -not $response.Body.token) {
        throw "Login as $Username failed (status $($response.Status))."
    }
    $response.Body.token
}

function New-TestStack {
    param([string]$Token, [string]$Name)
    $response = Invoke-Api POST '/api/Stacks/create-stack' $Token @{ name = "$Prefix $Name" }
    if ($response.Status -ne 200) { throw "Setup: create-stack '$Name' returned $($response.Status)." }
    $script:CreatedStacks.Add([pscustomobject]@{ Id = $response.Body.id; Token = $Token })
    $response.Body
}

function New-TestSubstack {
    param([string]$Token, [int]$StackId, [string]$Name)
    $response = Invoke-Api POST '/api/Substacks/create-substack' $Token @{ stackId = $StackId; name = $Name }
    if ($response.Status -ne 200) { throw "Setup: create-substack '$Name' returned $($response.Status)." }
    $response.Body
}

function New-TestCard {
    param([string]$Token, [int]$StackId, [string]$Question, [object]$SubstackId = $null)
    $body = @{ stackId = $StackId; question = $Question; answer = "Answer to $Question"; isMonospace = $false }
    if ($null -ne $SubstackId) { $body.substackId = $SubstackId }
    $response = Invoke-Api POST '/api/Cards/create-card' $Token $body
    if ($response.Status -ne 200) { throw "Setup: create-card '$Question' returned $($response.Status)." }
    $response.Body
}

# Both users' test data, as one string, so "nothing changed" is one comparison.
function Get-Snapshot {
    $parts = foreach ($stack in $script:SnapshotStacks) {
        $cards = Invoke-Api GET "/api/Cards/get-cards-by-stack/$($stack.Id)" $stack.Token
        $substacks = Invoke-Api GET "/api/Substacks/get-substacks-by-stack/$($stack.Id)" $stack.Token
        ConvertTo-Json -InputObject @($stack.Id, $cards.Status, $cards.Body, $substacks.Status, $substacks.Body) -Depth 6 -Compress
    }
    $parts -join "`n"
}

# A request that must be refused with $Expected, and must change nothing.
function Assert-Refused {
    param([string]$Name, [int]$Expected, [scriptblock]$Request)
    $before = Get-Snapshot
    $response = & $Request
    Assert-Status $Name $Expected $response
    $after = Get-Snapshot
    Assert-True "$Name : nothing changed" ($before -eq $after) '(test data differs after the request)'
}

function Get-Card {
    param([string]$Token, [int]$StackId, [int]$CardId)
    $cards = (Invoke-Api GET "/api/Cards/get-cards-by-stack/$StackId" $Token).Body
    $cards | Where-Object { $_.id -eq $CardId }
}

# ---------------------------------------------------------------- run

Write-Host "StudyStack substack API tests against $BaseUrl"
Write-Host "Test data is created under stack names starting with '$Prefix' and deleted at the end."
$TokenA = Get-Token $UserA
$TokenB = Get-Token $UserB

try {
    # ---------------------------------------------------------- setup
    $stackA1 = New-TestStack $TokenA 'A1'
    $stackA2 = New-TestStack $TokenA 'A2'
    $stackB1 = New-TestStack $TokenB 'B1'

    $substackA2 = New-TestSubstack $TokenA $stackA2.id 'A2 topic'
    $substackB1 = New-TestSubstack $TokenB $stackB1.id 'B1 topic'

    $card1 = New-TestCard $TokenA $stackA1.id 'Card 1'
    $card2 = New-TestCard $TokenA $stackA1.id 'Card 2'
    $card3 = New-TestCard $TokenA $stackA1.id 'Card 3'
    $cardA2 = New-TestCard $TokenA $stackA2.id 'Card in A2'
    $cardB1 = New-TestCard $TokenB $stackB1.id 'Card in B1' $substackB1.id

    $script:SnapshotStacks = @(
        [pscustomobject]@{ Id = $stackA1.id; Token = $TokenA }
        [pscustomobject]@{ Id = $stackA2.id; Token = $TokenA }
        [pscustomobject]@{ Id = $stackB1.id; Token = $TokenB }
    )

    Write-Host ''
    Write-Host '== Normal paths'

    $response = Invoke-Api POST '/api/Substacks/create-substack' $TokenA @{ stackId = $stackA1.id; name = 'Topic 1' }
    Assert-Status 'create-substack in my stack -> 200' 200 $response
    $substack1 = $response.Body
    Assert-True 'create-substack returns the stack id and 0 cards' ($substack1.stackId -eq $stackA1.id -and $substack1.cardCount -eq 0)

    $substack2 = New-TestSubstack $TokenA $stackA1.id 'Topic 2 before rename'

    $response = Invoke-Api GET "/api/Substacks/get-substacks-by-stack/$($stackA1.id)" $TokenA
    Assert-Status 'get-substacks-by-stack for my stack -> 200' 200 $response
    Assert-True 'substacks listed in creation order' ((@($response.Body).id -join ',') -eq "$($substack1.id),$($substack2.id)")

    $response = Invoke-Api GET "/api/Substacks/get-substack/$($substack1.id)" $TokenA
    Assert-Status 'get-substack for my substack -> 200' 200 $response

    $response = Invoke-Api PUT "/api/Substacks/update-substack/$($substack2.id)" $TokenA @{ name = 'Topic 2' }
    Assert-Status 'update-substack (rename) my substack -> 200' 200 $response
    Assert-True 'rename is saved' ($response.Body.name -eq 'Topic 2')

    $response = Invoke-Api POST '/api/Cards/create-card' $TokenA @{ stackId = $stackA1.id; question = 'Card 4'; answer = 'A'; isMonospace = $false; substackId = $substack1.id }
    Assert-Status 'create-card with my substack -> 200' 200 $response
    $card4 = $response.Body
    Assert-True 'create-card keeps the substack' ($card4.substackId -eq $substack1.id)

    Assert-True 'create-card without substackId (an old app) is unsorted' ($null -eq $card1.substackId)

    $response = Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card1.id, $card2.id); substackId = $substack1.id }
    Assert-Status 'move-cards two of my cards to my substack -> 200' 200 $response
    Assert-True 'move-cards returns both cards in the substack' (@($response.Body).Count -eq 2 -and @($response.Body | Where-Object substackId -eq $substack1.id).Count -eq 2)

    $response = Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card3.id); substackId = $substack2.id }
    Assert-Status 'move-cards one card to my other substack -> 200' 200 $response

    $response = Invoke-Api GET "/api/Cards/get-cards-by-stack/$($stackA1.id)" $TokenA
    $expectedOrder = "$($card1.id),$($card2.id),$($card4.id),$($card3.id)"
    Assert-True 'get-cards-by-stack is grouped: substacks in creation order, cards by id' ((@($response.Body).id -join ',') -eq $expectedOrder) "(expected $expectedOrder, got $(@($response.Body).id -join ','))"

    $response = Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card2.id); substackId = $null }
    Assert-Status 'move-cards to Not in a substack (null) -> 200' 200 $response
    Assert-True 'the card is unsorted' ($null -eq @($response.Body)[0].substackId)

    $response = Invoke-Api GET "/api/Cards/get-cards-by-stack/$($stackA1.id)" $TokenA
    $expectedOrder = "$($card1.id),$($card4.id),$($card3.id),$($card2.id)"
    Assert-True 'unsorted cards come last' ((@($response.Body).id -join ',') -eq $expectedOrder) "(expected $expectedOrder, got $(@($response.Body).id -join ','))"

    $response = Invoke-Api GET "/api/Cards/get-cards-by-substack/$($substack1.id)" $TokenA
    Assert-Status 'get-cards-by-substack for my substack -> 200' 200 $response
    Assert-True 'get-cards-by-substack returns only that substack''s cards' ((@($response.Body).id -join ',') -eq "$($card1.id),$($card4.id)")

    $response = Invoke-Api GET "/api/Stacks/get-stack/$($stackA1.id)" $TokenA
    Assert-True 'get-stack counts cards and substacks' ($response.Body.cardCount -eq 4 -and $response.Body.substackCount -eq 2) "(got $($response.Body.cardCount) cards, $($response.Body.substackCount) substacks)"

    $response = Invoke-Api GET '/api/Stacks/get-all-stacks' $TokenA
    $listed = @($response.Body) | Where-Object id -eq $stackA1.id
    Assert-True 'get-all-stacks includes substackCount' ($listed.substackCount -eq 2)

    $response = Invoke-Api POST '/api/Stacks/create-stack' $TokenA @{ name = "$Prefix created" }
    Assert-Status 'create-stack -> 200 (was 201)' 200 $response
    if ($response.Body.id) {
        $script:CreatedStacks.Add([pscustomobject]@{ Id = $response.Body.id; Token = $TokenA })
        Assert-True 'create-stack returns 0 cards and 0 substacks' ($response.Body.cardCount -eq 0 -and $response.Body.substackCount -eq 0)
    }

    Write-Host ''
    Write-Host "== Refused: $UserA reaching $UserB's data (each must change nothing)"

    Assert-Refused "get-substacks-by-stack for $UserB's stack -> 404" 404 { Invoke-Api GET "/api/Substacks/get-substacks-by-stack/$($stackB1.id)" $TokenA }
    Assert-Refused 'get-substacks-by-stack for a stack that does not exist -> 404' 404 { Invoke-Api GET "/api/Substacks/get-substacks-by-stack/$MissingId" $TokenA }
    Assert-Refused "get-substack for $UserB's substack -> 404" 404 { Invoke-Api GET "/api/Substacks/get-substack/$($substackB1.id)" $TokenA }
    Assert-Refused "create-substack in $UserB's stack -> 404" 404 { Invoke-Api POST '/api/Substacks/create-substack' $TokenA @{ stackId = $stackB1.id; name = 'Intruder' } }
    Assert-Refused "update-substack (rename) $UserB's substack -> 404" 404 { Invoke-Api PUT "/api/Substacks/update-substack/$($substackB1.id)" $TokenA @{ name = 'Renamed by someone else' } }
    Assert-Refused "delete-substack $UserB's substack -> 404" 404 { Invoke-Api DELETE "/api/Substacks/delete-substack/$($substackB1.id)" $TokenA }
    Assert-Refused "get-cards-by-substack for $UserB's substack -> 404" 404 { Invoke-Api GET "/api/Cards/get-cards-by-substack/$($substackB1.id)" $TokenA }
    Assert-Refused "create-card in my stack with $UserB's substack -> 404" 404 { Invoke-Api POST '/api/Cards/create-card' $TokenA @{ stackId = $stackA1.id; question = 'Q'; answer = 'A'; isMonospace = $false; substackId = $substackB1.id } }
    Assert-Refused "move-cards my card to $UserB's substack -> 404" 404 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card3.id); substackId = $substackB1.id } }
    Assert-Refused "move-cards $UserB's card to my substack -> 404" 404 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($cardB1.id); substackId = $substack1.id } }
    Assert-Refused "move-cards $UserB's card to Not in a substack -> 404" 404 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($cardB1.id); substackId = $null } }
    Assert-Refused "move-cards my card plus $UserB's card (all or nothing) -> 404" 404 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card2.id, $cardB1.id); substackId = $substack1.id } }

    Write-Host ''
    Write-Host '== Refused: my own data, but the wrong stack'

    Assert-Refused 'create-card in A1 with a substack from my stack A2 -> 404' 404 { Invoke-Api POST '/api/Cards/create-card' $TokenA @{ stackId = $stackA1.id; question = 'Q'; answer = 'A'; isMonospace = $false; substackId = $substackA2.id } }
    Assert-Refused 'move-cards an A1 card to a substack from my stack A2 -> 404' 404 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card2.id); substackId = $substackA2.id } }
    Assert-Refused 'move-cards cards from two of my stacks at once -> 404' 404 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card2.id, $cardA2.id); substackId = $null } }

    Write-Host ''
    Write-Host '== Refused: bad requests'

    Assert-Refused 'move-cards a card id that does not exist -> 404' 404 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($MissingId); substackId = $null } }
    Assert-Refused 'move-cards to a substack that does not exist -> 404' 404 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card2.id); substackId = $MissingId } }
    Assert-Refused 'move-cards with a duplicate id -> 400' 400 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @($card2.id, $card2.id); substackId = $substack1.id } }
    Assert-Refused 'move-cards with an empty list -> 400' 400 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @(); substackId = $substack1.id } }
    Assert-Refused 'move-cards with 1,001 ids -> 400' 400 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA @{ cardIds = @(1..1001); substackId = $null } }
    Assert-Refused 'move-cards without the substackId field -> 400' 400 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA "{`"cardIds`":[$($card2.id)]}" -RawBody }
    Assert-Refused 'move-cards without the cardIds field -> 400' 400 { Invoke-Api PUT '/api/Cards/move-cards' $TokenA "{`"substackId`":null}" -RawBody }
    Assert-Refused 'get-substacks-by-stack with no token -> 401' 401 { Invoke-Api GET "/api/Substacks/get-substacks-by-stack/$($stackA1.id)" $null }
    Assert-Refused 'move-cards with no token -> 401' 401 { Invoke-Api PUT '/api/Cards/move-cards' $null @{ cardIds = @($card2.id); substackId = $null } }

    Write-Host ''
    Write-Host '== Deletes'

    $response = Invoke-Api DELETE "/api/Substacks/delete-substack/$($substack1.id)" $TokenA
    Assert-Status 'delete-substack my substack -> 204' 204 $response
    $moved = Get-Card $TokenA $stackA1.id $card1.id
    Assert-True "the deleted substack's cards stay in the stack, unsorted" ($null -ne $moved -and $null -eq $moved.substackId)
    $response = Invoke-Api GET "/api/Substacks/get-substack/$($substack1.id)" $TokenA
    Assert-Status 'the deleted substack is gone -> 404' 404 $response

    $response = Invoke-Api DELETE "/api/Stacks/delete-stack/$($stackA1.id)" $TokenA
    Assert-Status 'delete-stack with a substack and cards -> 204' 204 $response
    $response = Invoke-Api GET "/api/Substacks/get-substack/$($substack2.id)" $TokenA
    Assert-Status "the deleted stack's substack is gone -> 404" 404 $response
    $response = Invoke-Api GET "/api/Cards/get-cards-by-stack/$($stackA1.id)" $TokenA
    Assert-Status "the deleted stack's cards are gone -> 404" 404 $response

    $response = Invoke-Api GET "/api/Substacks/get-substack/$($substackB1.id)" $TokenB
    Assert-Status "$UserB's substack is untouched by all of the above -> 200" 200 $response
    $untouched = Get-Card $TokenB $stackB1.id $cardB1.id
    Assert-True "$UserB's card is untouched by all of the above" ($null -ne $untouched -and $untouched.substackId -eq $substackB1.id -and $untouched.question -eq 'Card in B1')
}
finally {
    Write-Host ''
    Write-Host '== Cleanup'
    foreach ($stack in $script:CreatedStacks) {
        $response = Invoke-Api DELETE "/api/Stacks/delete-stack/$($stack.Id)" $stack.Token
        if ($response.Status -notin 204, 404) {
            Write-Host "Could not delete test stack $($stack.Id) (status $($response.Status)); delete stacks named '$Prefix ...' by hand." -ForegroundColor Yellow
        }
    }
    Write-Host 'Test stacks deleted.'
}

$failed = @($script:Results | Where-Object { -not $_.Passed })
Write-Host ''
Write-Host "$($script:Results.Count - $failed.Count) of $($script:Results.Count) checks passed."
if ($failed.Count -gt 0) {
    Write-Host "$($failed.Count) FAILED:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor Red }
    exit 1
}
Write-Host 'All checks passed.' -ForegroundColor Green
exit 0
