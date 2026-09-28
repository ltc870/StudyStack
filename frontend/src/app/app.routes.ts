import { Routes } from '@angular/router';
import { Welcome } from './pages/welcome/welcome';
import { ManageCards } from './pages/manage-cards/manage-cards';
import { ManageStacks } from './pages/manage-stacks/manage-stacks';
import { Study } from './pages/study/study';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: 'welcome',
        component: Welcome,
        title: 'StudyStack',
    },
    {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full'
    } ,
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: 'stacks',
                component: ManageStacks,
                data: { mode: 'manage' },
                title: 'Manage Stacks | StudyStack',
            },
            {
                path: 'stacks/study',
                component: ManageStacks,
                data: { mode: 'study' },
                title: 'Choose a Stack | StudyStack',
            },
            {
                path: 'stacks/:stackId/cards',
                component: ManageCards,
                title: 'Manage Cards | StudyStack',
            },
            {
                path: 'study/:stackId',
                component: Study,
                title: 'Study | StudyStack',
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'welcome'
    }
];
