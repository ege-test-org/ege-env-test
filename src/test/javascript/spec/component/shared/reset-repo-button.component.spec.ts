import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockComponent, MockDirective, MockPipe } from 'ng-mocks';
import { ExerciseActionButtonComponent } from 'app/shared/components/exercise-action-button.component';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { MockFeatureToggleService } from '../../helpers/mocks/service/mock-feature-toggle.service';
import { FeatureToggleService } from 'app/shared/feature-toggle/feature-toggle.service';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { FeatureToggleDirective } from 'app/shared/feature-toggle/feature-toggle.directive';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { Subject } from 'rxjs';
import { ResetRepoButtonComponent } from 'app/shared/components/reset-repo-button/reset-repo-button.component';
import { ParticipationService } from 'app/exercise/participation/participation.service';
import { ProgrammingExerciseParticipationService } from 'app/programming/manage/services/programming-exercise-participation.service';
import { MockParticipationService } from '../../helpers/mocks/service/mock-participation.service';
import { InitializationState } from 'app/entities/participation/participation.model';
import dayjs from 'dayjs/esm';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AccountService } from 'app/core/auth/account.service';
import { MockAccountService } from '../../helpers/mocks/service/mock-account.service';

describe('JhiResetRepoButtonComponent', () => {
    let comp: ResetRepoButtonComponent;
    let fixture: ComponentFixture<ResetRepoButtonComponent>;

    let resetRepositoryStub: jest.SpyInstance;

    const gradedParticipation: StudentParticipation = { id: 1, testRun: false };
    const practiceParticipation: StudentParticipation = { id: 2, testRun: true };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgbPopoverModule],
            declarations: [ResetRepoButtonComponent, MockComponent(ExerciseActionButtonComponent), MockPipe(ArtemisTranslatePipe), MockDirective(FeatureToggleDirective)],
            providers: [
                { provide: ParticipationService, useClass: MockParticipationService },
                { provide: FeatureToggleService, useClass: MockFeatureToggleService },
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: AccountService, useClass: MockAccountService },
                provideHttpClient(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ResetRepoButtonComponent);
        comp = fixture.componentInstance;
        const programmingExerciseParticipationService = fixture.debugElement.injector.get(ProgrammingExerciseParticipationService);

        resetRepositoryStub = jest.spyOn(programmingExerciseParticipationService, 'resetRepository');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize correctly', () => {
        comp.exercise = { numberOfAssessmentsOfCorrectionRounds: [], secondCorrectionEnabled: false, studentAssignedTeamIdComputed: false };
        comp.participations = [gradedParticipation, practiceParticipation];
        comp.ngOnInit();

        expect(comp.gradedParticipation).toEqual(gradedParticipation);
        expect(comp.practiceParticipation).toEqual(practiceParticipation);
    });

    it.each([
        { participations: [{ testRun: false, initializationState: InitializationState.INITIALIZED }], exercise: {}, shouldShowButton: true },
        { participations: [{ testRun: false, initializationState: InitializationState.INITIALIZED }], exercise: { dueDate: dayjs().add(1, 'day') }, shouldShowButton: true },
        { participations: [{ testRun: false, initializationState: InitializationState.INITIALIZED }], exercise: { dueDate: dayjs().subtract(1, 'day') }, shouldShowButton: false },
        { participations: [{ testRun: false, initializationState: InitializationState.INACTIVE }], exercise: { dueDate: dayjs().add(1, 'day') }, shouldShowButton: false },
        {
            participations: [{ testRun: false, initializationState: InitializationState.INITIALIZED, individualDueDate: dayjs().add(1, 'day') }],
            exercise: { dueDate: dayjs().subtract(1, 'day') },
            shouldShowButton: true,
        },
        {
            participations: [
                { testRun: false, initializationState: InitializationState.INACTIVE },
                { testRun: true, initializationState: InitializationState.INITIALIZED },
            ],
            exercise: { dueDate: dayjs().subtract(1, 'day') },
            shouldShowButton: true,
        },
    ])('should show button for correct configurations', ({ participations, exercise, shouldShowButton }) => {
        comp.exercise = exercise as ProgrammingExercise;
        comp.participations = participations;

        comp.ngOnInit();

        fixture.detectChanges();

        const resetButton = fixture.debugElement.query(By.css('.btn-danger'));
        expect(!!resetButton).toEqual(shouldShowButton);
    });

    it.each([
        { participations: [gradedParticipation, practiceParticipation], expectedResetId: practiceParticipation.id, gradedParticipationId: gradedParticipation.id },
        { participations: [gradedParticipation, practiceParticipation], expectedResetId: practiceParticipation.id },
        { participations: [practiceParticipation], expectedResetId: practiceParticipation.id },
        { participations: [gradedParticipation], expectedResetId: gradedParticipation.id },
    ])('should reset repository correctly', ({ participations, expectedResetId, gradedParticipationId }) => {
        const resetSubject = new Subject<void>();

        comp.participations = participations;
        comp.exercise = { id: 3 } as ProgrammingExercise;
        comp.ngOnInit();

        resetRepositoryStub.mockReturnValue(resetSubject);
        comp.resetRepository(gradedParticipationId);
        expect(comp.exercise.loading).toBeTrue();
        resetSubject.next();

        expect(resetRepositoryStub).toHaveBeenCalledWith(expectedResetId, gradedParticipationId);
    });
});
