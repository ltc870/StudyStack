import { Routes } from '@angular/router';
import { Welcome } from './pages/welcome/welcome';
import { Login } from './pages/login/login';
import { ManageCards } from './pages/manage-cards/manage-cards';
import { ManageStacks } from './pages/manage-stacks/manage-stacks';
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
    pathMatch: 'full',
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
        data: { mode: 'study', backTo: '/welcome' },
        title: 'Choose a Stack | StudyStack',
      },
      {
        path: 'stacks/:stackId/cards',
        component: ManageCards,
        data: { backTo: '/stacks' },
        title: 'Manage Cards | StudyStack',
      },
      {
        path: 'updates',
        loadComponent: () => import('./pages/updates/updates').then((module) => module.Updates),
        data: { backTo: '/welcome' },
        title: 'Updates | StudyStack',
      },
      {
        path: 'study/:stackId',
        loadComponent: () => import('./pages/study/study').then((module) => module.Study),
        title: 'Study | StudyStack',
      },
      {
        path: 'study/:stackId/substacks/:substackId',
        loadComponent: () => import('./pages/study/study').then((module) => module.Study),
        title: 'Study | StudyStack',
      },
      {
        path: 'stacks/:stackId/substacks',
        loadComponent: () =>
          import('./pages/manage-substacks/manage-substacks').then(
            (module) => module.ManageSubstacks,
          ),
        title: 'Manage Substacks | StudyStack',
      },
      {
        path: 'stacks/study/:stackId',
        loadComponent: () =>
          import('./pages/choose-what-to-study/choose-what-to-study').then(
            (module) => module.ChooseWhatToStudy,
          ),
        data: { backTo: '/stacks/study' },
        title: 'Choose What to Study | StudyStack',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'welcome',
  },
];
