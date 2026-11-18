import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'admin-home',
    loadComponent: () => import('./admin-home/admin-home.page').then((m) => m.AdminHomePage),
  },
  {
    path: 'vaccine',
    loadComponent: () => import('./vaccine/vaccine.page').then((m) => m.VaccinePage),
  },
  {
    path: 'add-child',
    loadComponent: () => import('./add-child/add-child.page').then((m) => m.AddChildPage),
  },
  {
    path: 'vaccine-sched',
    loadComponent: () => import('./vaccine-sched/vaccine-sched.page').then((m) => m.VaccineSchedPage),
  },
  {
    path: 'archive',
    loadComponent: () => import('./archive/archive.page').then((m) => m.ArchivePage),
  },
  {
    path: 'archive-records',
    loadComponent: () => import('./archive-records/archive-records.page').then((m) => m.ArchiveRecordsPage),
  },
  {
    path: 'archive-schedule',
    loadComponent: () => import('./archive-schedule/archive-schedule.page').then((m) => m.ArchiveSchedulePage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'child-dict',
    loadComponent: () => import('./child-dict/child-dict.page').then((m) => m.ChildDictPage),
  },
];
