import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpHeaders, HttpResponse, provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ModelingExerciseDetailComponent } from 'app/modeling/manage/modeling-exercise-detail.component';
import { ModelingExercise } from 'app/entities/modeling-exercise.model';
import { ModelingExerciseService } from 'app/modeling/manage/modeling-exercise.service';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { MockComponent } from 'ng-mocks';
import { NonProgrammingExerciseDetailCommonActionsComponent } from 'app/exercise/exercise-detail-common-actions/non-programming-exercise-detail-common-actions.component';
import { ExerciseManagementStatisticsDto } from 'app/exercise/statistics/exercise-management-statistics-dto';
import { StatisticsService } from 'app/shared/statistics-graph/statistics.service';
import { EventManager } from 'app/shared/service/event-manager.service';
import { AlertService } from 'app/shared/service/alert.service';
import { MockAlertService } from '../../helpers/mocks/service/mock-alert.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountService } from 'app/core/auth/account.service';
import { MockAccountService } from '../../helpers/mocks/service/mock-account.service';
import { ProfileService } from 'app/shared/layouts/profiles/profile.service';
import { MockProfileService } from '../../helpers/mocks/service/mock-profile.service';

describe('ModelingExercise Management Detail Component', () => {
    let comp: ModelingExerciseDetailComponent;
    let fixture: ComponentFixture<ModelingExerciseDetailComponent>;
    let modelingExerciseService: ModelingExerciseService;
    let eventManager: EventManager;
    let statisticsService: StatisticsService;
    let alertService: AlertService;

    const model = { element: { id: '33' } };
    const modelingExercise = { id: 123, exampleSolutionModel: JSON.stringify(model) } as ModelingExercise;
    const route = { params: of({ exerciseId: modelingExercise.id }) } as any as ActivatedRoute;
    const modelingExerciseStatistics = {
        averageScoreOfExercise: 50,
        maxPointsOfExercise: 10,
        absoluteAveragePoints: 5,
        scoreDistribution: [5, 0, 0, 0, 0, 0, 0, 0, 0, 5],
        numberOfExerciseScores: 10,
        numberOfParticipations: 10,
        numberOfStudentsOrTeamsInCourse: 10,
        participationsInPercent: 100,
        numberOfPosts: 4,
        numberOfResolvedPosts: 2,
        resolvedPostsInPercent: 50,
    } as ExerciseManagementStatisticsDto;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ModelingExerciseDetailComponent, MockComponent(NonProgrammingExerciseDetailCommonActionsComponent)],
            providers: [
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: ActivatedRoute, useValue: route },
                { provide: AlertService, useClass: MockAlertService },
                { provide: AccountService, useClass: MockAccountService },
                { provide: ProfileService, useClass: MockProfileService },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        })
            .overrideTemplate(ModelingExerciseDetailComponent, '')
            .compileComponents();
        fixture = TestBed.createComponent(ModelingExerciseDetailComponent);
        comp = fixture.componentInstance;
        modelingExerciseService = fixture.debugElement.injector.get(ModelingExerciseService);
        statisticsService = fixture.debugElement.injector.get(StatisticsService);
        eventManager = fixture.debugElement.injector.get(EventManager);
        alertService = fixture.debugElement.injector.get(AlertService);
        fixture.detectChanges();
    });

    it('should load exercise on init', fakeAsync(() => {
        // GIVEN
        const subscribeSpy = jest.spyOn(eventManager, 'subscribe');
        const headers = new HttpHeaders().append('link', 'link;link');
        const findStub = jest.spyOn(modelingExerciseService, 'find').mockReturnValue(
            of(
                new HttpResponse({
                    body: modelingExercise,
                    headers,
                }),
            ),
        );
        const statisticsServiceStub = jest.spyOn(statisticsService, 'getExerciseStatistics').mockReturnValue(of(modelingExerciseStatistics));

        // WHEN
        comp.ngOnInit();

        // THEN
        expect(findStub).toHaveBeenCalledOnce();
        expect(statisticsServiceStub).toHaveBeenCalledOnce();
        expect(comp.modelingExercise).toEqual(modelingExercise);
        expect(comp.doughnutStats.participationsInPercent).toBe(100);
        expect(comp.doughnutStats.resolvedPostsInPercent).toBe(50);
        expect(comp.doughnutStats.absoluteAveragePoints).toBe(5);
        expect(subscribeSpy).toHaveBeenCalledWith('modelingExerciseListModification', expect.anything());
        tick();
        expect(comp.exampleSolutionUML).toEqual(model);
    }));

    it('should destroy event manager on destroy', () => {
        const destroySpy = jest.spyOn(eventManager, 'destroy');
        comp.ngOnDestroy();
        expect(destroySpy).toHaveBeenCalledOnce();
    });

    it('should build cluster', async () => {
        const buildClusterSpy = jest.spyOn(modelingExerciseService, 'buildClusters').mockReturnValue(of(new HttpResponse({ body: null })));
        const successSpy = jest.spyOn(alertService, 'success');
        comp.modelingExercise = modelingExercise;
        comp.buildModelClusters();
        expect(buildClusterSpy).toHaveBeenCalledOnce();
        await Promise.resolve();
        expect(successSpy).toHaveBeenCalledOnce();
    });

    it('should error on build cluster', async () => {
        const buildClusterSpy = jest.spyOn(modelingExerciseService, 'buildClusters').mockReturnValue(throwError(null));
        const errorSpy = jest.spyOn(alertService, 'error');
        comp.modelingExercise = modelingExercise;
        comp.buildModelClusters();
        expect(buildClusterSpy).toHaveBeenCalledOnce();
        await Promise.resolve();
        expect(errorSpy).toHaveBeenCalledOnce();
    });

    it('should delete cluster', async () => {
        const buildClusterSpy = jest.spyOn(modelingExerciseService, 'deleteClusters').mockReturnValue(of(new HttpResponse({ body: null })));
        const successSpy = jest.spyOn(alertService, 'success');
        comp.modelingExercise = modelingExercise;
        comp.deleteModelClusters();
        expect(buildClusterSpy).toHaveBeenCalledOnce();
        await Promise.resolve();
        expect(successSpy).toHaveBeenCalledOnce();
    });

    it('should error on elete cluster', async () => {
        const buildClusterSpy = jest.spyOn(modelingExerciseService, 'deleteClusters').mockReturnValue(throwError(null));
        const errorSpy = jest.spyOn(alertService, 'error');
        comp.modelingExercise = modelingExercise;
        comp.deleteModelClusters();
        expect(buildClusterSpy).toHaveBeenCalledOnce();
        await Promise.resolve();
        expect(errorSpy).toHaveBeenCalledOnce();
    });
});
