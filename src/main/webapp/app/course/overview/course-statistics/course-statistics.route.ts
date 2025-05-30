import { Authority } from 'app/shared/constants/authority.constants';
import { UserRouteAccessService } from 'app/core/auth/user-route-access-service';
import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('app/course/overview/course-statistics/course-statistics.component').then((m) => m.CourseStatisticsComponent),
        data: {
            authorities: [Authority.USER],
            pageTitle: 'overview.statistics',
        },
        canActivate: [UserRouteAccessService],
    },
    {
        path: 'grading-key',
        loadComponent: () => import('app/assessment/manage/grading-system/grading-key-overview/grading-key-overview.component').then((m) => m.GradingKeyOverviewComponent),
        data: {
            authorities: [Authority.USER],
            pageTitle: 'artemisApp.gradingSystem.title',
        },
        canActivate: [UserRouteAccessService],
    },
];
