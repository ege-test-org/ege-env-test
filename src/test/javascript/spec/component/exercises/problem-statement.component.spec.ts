import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ExerciseService } from 'app/exercise/exercise.service';
import { ParticipationService } from 'app/exercise/participation/participation.service';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import { Course } from 'app/entities/course.model';
import { TextExercise } from 'app/entities/text/text-exercise.model';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { ProblemStatementComponent } from 'app/course/overview/exercise-details/problem-statement/problem-statement.component';
import { MockProvider } from 'ng-mocks';
import { Exercise, ExerciseType } from 'app/entities/exercise.model';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountService } from 'app/core/auth/account.service';
import { MockAccountService } from '../../helpers/mocks/service/mock-account.service';
import { ThemeService } from 'app/core/theme/shared/theme.service';
import { MockThemeService } from '../../helpers/mocks/service/mock-theme.service';

describe('ProblemStatementComponent', () => {
    let component: ProblemStatementComponent;
    let fixture: ComponentFixture<ProblemStatementComponent>;
    let mockActivatedRoute: any;

    let exerciseService: ExerciseService;
    let participationService: ParticipationService;

    let getExerciseDetailsMock: jest.SpyInstance;
    let getParticipationDetailMock: jest.SpyInstance;

    const course = { id: 1 } as unknown as Course;
    const exercise = new ProgrammingExercise(course, undefined);
    const participation = { id: 2 } as unknown as StudentParticipation;

    beforeEach(() => {
        mockActivatedRoute = {
            params: of({ exerciseId: '1', participationId: '2' }),
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                MockProvider(ParticipationService),
                MockProvider(ExerciseService),
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: AccountService, useClass: MockAccountService },
                { provide: ThemeService, useClass: MockThemeService },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ProblemStatementComponent);
                component = fixture.componentInstance;

                // mock exerciseService
                exerciseService = fixture.debugElement.injector.get(ExerciseService);
                getExerciseDetailsMock = jest.spyOn(exerciseService, 'getExerciseDetails');
                exercise.problemStatement = 'Test problem statement';
                course.exercises = [exercise];
                getExerciseDetailsMock.mockReturnValue(of({ body: { exercise: exercise } }));

                // mock participationService
                participationService = fixture.debugElement.injector.get(ParticipationService);
                getParticipationDetailMock = jest.spyOn(participationService, 'find');
                getParticipationDetailMock.mockReturnValue(of(new HttpResponse({ body: participation })));
            });
    });

    it('should render problem statement when exercise is available', () => {
        const exercise = new TextExercise(course, undefined);
        exercise.problemStatement = 'Test problem statement';

        component.exercise = exercise;
        fixture.detectChanges();

        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('#problem-statement')).toBeTruthy();
        expect(compiled.querySelector('#problem-statement p').innerHTML).toContain('Test problem statement');
    });

    it('should render problem statement when exercise is available by getting from services', fakeAsync(() => {
        fixture.detectChanges();
        tick(500);

        expect(getParticipationDetailMock).toHaveBeenCalledOnce();
        expect(getExerciseDetailsMock).toHaveBeenCalledOnce();

        expect(component.exercise).toEqual(exercise);
        expect(component.participation).toEqual(participation);
    }));

    describe('isProgrammingExercise', () => {
        it('should return true if exercise type is PROGRAMMING', () => {
            component.exercise = { id: 1, type: ExerciseType.PROGRAMMING } as Exercise;
            expect(component.isProgrammingExercise).toBeTrue();
        });

        it('should return false if exercise type is not PROGRAMMING', () => {
            component.exercise = { id: 1, type: ExerciseType.QUIZ } as Exercise;
            expect(component.isProgrammingExercise).toBeFalse();
        });

        it('should return false if exercise is not defined', () => {
            component.exercise = undefined;
            expect(component.isProgrammingExercise).toBeFalse();
        });
    });

    it('should render programming exercise instructions when exercise is a programming exercise and participation and exercise are available', () => {
        component.exercise = exercise;
        component.participation = participation;
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('jhi-programming-exercise-instructions')).toBeTruthy();
    });

    it('should not render programming exercise instructions when exercise is not a programming exercise', () => {
        const exercise = new TextExercise(course, undefined);
        exercise.problemStatement = 'Test problem statement';

        component.exercise = exercise;
        component.participation = participation;
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('jhi-programming-exercise-instructions')).toBeFalsy();
    });
});
