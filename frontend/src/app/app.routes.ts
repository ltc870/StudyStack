import { Routes } from '@angular/router';
import { Welcome } from './pages/welcome/welcome';
import { Login } from './pages/login/login';
import { ManageCards } from './pages/manage-cards/manage-cards';
import { ManageStacks } from './pages/manage-stacks/manage-stacks';
import { Study } from './pages/study/study';
import { authGuard } from './guards/auth-guard';
import { AppShell } from './components/app-shell/app-shell';

export const routes: Routes = [
    {
        path: 'login',
        component: Login,
        title: 'StudyStack',
    },
    {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full'
    },
    {
        path: '',
        component: AppShell,
        canActivate: [authGuard],
        children: [
            {
                path: 'welcome',
                component: Welcome,
                title: 'StudyStack',
            },
            {
                path: 'stacks',
                component: ManageStacks,
                data: { mode: 'manage', backTo: '/welcome' },
                title: 'Manage Stacks | StudyStack',
            },
            {
                path: 'stacks/study',
                component: ManageStacks,
                data: { mode: 'study', backTo: '/welcome'},
                title: 'Choose a Stack | StudyStack',
            },
            {
                path: 'stacks/:stackId/cards',
                component: ManageCards,
                data: { backTo: '/stacks' },
                title: 'Manage Cards | StudyStack',
            },
            {
                path: 'study/:stackId',
                component: Study,
                data: { backTo: '/stacks/study' },
                title: 'Study | StudyStack',
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'welcome'
    }
];
