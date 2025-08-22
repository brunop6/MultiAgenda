import { Routes } from '@angular/router';

export const eventsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./events-list/events-list.component').then(m => m.EventsListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./event-form/event-form.component').then(m => m.EventFormComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./event-form/event-form.component').then(m => m.EventFormComponent)
  }
];

