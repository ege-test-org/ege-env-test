import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { OrionExerciseAssessmentDashboardComponent } from 'app/orion/manage/assessment/orion-exercise-assessment-dashboard.component';
import { ExerciseType } from 'app/entities/exercise.model';
import { TutorParticipationStatus } from 'app/entities/participation/tutor-participation.model';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { OrionConnectorService } from 'app/shared/orion/orion-connector.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { AlertService } from 'app/shared/service/alert.service';
import { ExerciseAssessmentDashboardComponent } from 'app/exercise/dashboards/tutor/exercise-assessment-dashboard.component';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { OrionState } from 'app/shared/orion/orion';
import { ExerciseService } from 'app/exercise/exercise.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { OrionAssessmentService } from 'app/orion/manage/assessment/orion-assessment.service';
import { OrionButtonComponent } from 'app/shared/orion/orion-button/orion-button.component';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';

describe('OrionExerciseAssessmentDashboardComponent', () => {
    let comp: OrionExerciseAssessmentDashboardComponent;
    let orionConnectorService: OrionConnectorService;
    let orionAssessmentService: OrionAssessmentService;
    let exerciseService: ExerciseService;
    let alertService: AlertService;

    const programmingExercise = {
        id: 16,
        type: ExerciseType.PROGRAMMING,
        tutorParticipations: [{ status: TutorParticipationStatus.TRAINED }],
        secondCorrectionEnabled: false,
    } as ProgrammingExercise;
    const programmingSubmission = { id: 11, participation: { id: 1 } } as any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                OrionExerciseAssessmentDashboardComponent,
                MockComponent(ExerciseAssessmentDashboardComponent),
                MockPipe(ArtemisTranslatePipe),
                MockComponent(OrionButtonComponent),
            ],
            providers: [
                MockProvider(OrionConnectorService),
                MockProvider(OrionAssessmentService),
                MockProvider(ExerciseService),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ exerciseId: 10 }) } } },
                { provide: TranslateService, useClass: MockTranslateService },
            ],
        })
            .compileComponents()
            .then(() => {
                comp = TestBed.createComponent(OrionExerciseAssessmentDashboardComponent).componentInstance;
                orionConnectorService = TestBed.inject(OrionConnectorService);
                orionAssessmentService = TestBed.inject(OrionAssessmentService);
                exerciseService = TestBed.inject(ExerciseService);
                alertService = TestBed.inject(AlertService);
                comp.exerciseId = programmingExercise.id!;
                comp.exercise = programmingExercise;
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('openAssessmentInOrion should call connector', () => {
        const assessExerciseSpy = jest.spyOn(orionConnectorService, 'assessExercise');

        comp.openAssessmentInOrion();

        expect(assessExerciseSpy).toHaveBeenCalledOnce();
        expect(assessExerciseSpy).toHaveBeenCalledWith(programmingExercise);
    });

    it('downloadSubmissionInOrion should call service', () => {
        const downloadSubmissionSpy = jest.spyOn(orionAssessmentService, 'downloadSubmissionInOrion');

        comp.downloadSubmissionInOrion(programmingSubmission, 2);

        expect(downloadSubmissionSpy).toHaveBeenCalledOnce();
        expect(downloadSubmissionSpy).toHaveBeenCalledWith(comp.exerciseId, programmingSubmission, 2, false);
    });

    it('ngOnInit should subscribe correctly', fakeAsync(() => {
        const orionState = { opened: 40, building: false, cloning: false } as OrionState;
        const stateObservable = new BehaviorSubject(orionState);
        const orionStateStub = jest.spyOn(orionConnectorService, 'state').mockReturnValue(stateObservable);

        const response = of(new HttpResponse({ body: programmingExercise, status: 200 }));
        const getForTutorsStub = jest.spyOn(exerciseService, 'getForTutors').mockReturnValue(response);

        comp.ngOnInit();
        tick();

        expect(comp.exerciseId).toBe(10);
        expect(comp.exercise).toEqual(programmingExercise);
        expect(comp.orionState).toEqual(orionState);

        expect(getForTutorsStub).toHaveBeenCalledOnce();
        expect(getForTutorsStub).toHaveBeenCalledWith(10);
        expect(orionStateStub).toHaveBeenCalled();
        expect(orionStateStub).toHaveBeenCalledWith();
    }));

    it('ngOnInit should deal with error correctly', fakeAsync(() => {
        const orionState = { opened: 40, building: false, cloning: false } as OrionState;
        const stateObservable = new BehaviorSubject(orionState);
        const orionStateStub = jest.spyOn(orionConnectorService, 'state').mockReturnValue(stateObservable);

        const error = new HttpErrorResponse({ status: 400 });
        const getForTutorsStub = jest.spyOn(exerciseService, 'getForTutors').mockReturnValue(throwError(() => error));

        const errorSpy = jest.spyOn(alertService, 'error');
        // counter the initialization in beforeEach. as any required to cheat the typecheck
        comp.exercise = undefined as any;

        comp.ngOnInit();
        tick();

        expect(comp.exerciseId).toBe(10);
        expect(comp.exercise).toBeUndefined();
        expect(comp.orionState).toEqual(orionState);

        expect(getForTutorsStub).toHaveBeenCalledOnce();
        expect(getForTutorsStub).toHaveBeenCalledWith(10);
        expect(orionStateStub).toHaveBeenCalled();
        expect(orionStateStub).toHaveBeenCalledWith();
        expect(errorSpy).toHaveBeenCalledOnce();
        expect(errorSpy).toHaveBeenCalledWith('error.http.400');
    }));
});
