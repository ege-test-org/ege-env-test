import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CourseCompetenciesDetailsComponent } from 'app/atlas/overview/course-competencies/course-competencies-details.component';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { MockComponent, MockDirective, MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AlertService } from 'app/shared/service/alert.service';
import { LectureUnitService } from 'app/lecture/manage/lecture-units/lectureUnit.service';
import { AttachmentUnitComponent } from 'app/lecture/overview/course-lectures/attachment-unit/attachment-unit.component';
import { ExerciseUnitComponent } from 'app/lecture/overview/course-lectures/exercise-unit/exercise-unit.component';
import { TextUnitComponent } from 'app/lecture/overview/course-lectures/text-unit/text-unit.component';
import { VideoUnitComponent } from 'app/lecture/overview/course-lectures/video-unit/video-unit.component';
import { OnlineUnitComponent } from 'app/lecture/overview/course-lectures/online-unit/online-unit.component';
import { CompetencyRingsComponent } from 'app/atlas/shared/competency-rings/competency-rings.component';
import { SidePanelComponent } from 'app/shared/side-panel/side-panel.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FireworksComponent } from 'app/shared/fireworks/fireworks.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MockRouter } from '../../../helpers/mocks/mock-router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Competency, CompetencyExerciseLink, CompetencyLectureUnitLink, CompetencyProgress } from 'app/entities/competency.model';
import { TextExercise } from 'app/entities/text/text-exercise.model';
import { TextUnit } from 'app/entities/lecture-unit/textUnit.model';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { MockHasAnyAuthorityDirective } from '../../../helpers/mocks/directive/mock-has-any-authority.directive';
import { By } from '@angular/platform-browser';
import { HelpIconComponent } from 'app/shared/components/help-icon.component';
import { ModelingExercise } from 'app/entities/modeling-exercise.model';
import dayjs from 'dayjs/esm';
import { ArtemisTimeAgoPipe } from 'app/shared/pipes/artemis-time-ago.pipe';
import { HtmlForMarkdownPipe } from 'app/shared/pipes/html-for-markdown.pipe';
import { FeatureToggleService } from 'app/shared/feature-toggle/feature-toggle.service';
import { CourseStorageService } from 'app/course/manage/course-storage.service';
import { CourseCompetencyService } from 'app/atlas/shared/course-competency.service';
import { LectureUnitCompletionEvent } from 'app/lecture/overview/course-lectures/course-lecture-details.component';
import { MockTranslateService } from '../../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { MockAccountService } from '../../../helpers/mocks/service/mock-account.service';

describe('CourseCompetenciesDetails', () => {
    let fixture: ComponentFixture<CourseCompetenciesDetailsComponent>;
    let component: CourseCompetenciesDetailsComponent;

    let courseCompetencyService: CourseCompetencyService;

    let setCompletionSpy: jest.SpyInstance;
    let getProgressSpy: jest.SpyInstance;

    const parentParams = { courseId: 1 };
    const parentRoute = { parent: { params: of(parentParams) } } as any as ActivatedRoute;
    // example route looks like: /courses/1/competencies/10
    const route = { params: of({ competencyId: 10 }), parent: parentRoute } as any as ActivatedRoute;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MockModule(NgbTooltipModule)],
            declarations: [
                CourseCompetenciesDetailsComponent,
                MockPipe(ArtemisTranslatePipe),
                MockDirective(MockHasAnyAuthorityDirective),
                MockComponent(AttachmentUnitComponent),
                MockComponent(ExerciseUnitComponent),
                MockComponent(TextUnitComponent),
                MockComponent(VideoUnitComponent),
                MockComponent(OnlineUnitComponent),
                MockComponent(CompetencyRingsComponent),
                MockComponent(SidePanelComponent),
                MockComponent(HelpIconComponent),
                MockComponent(FaIconComponent),
                MockComponent(FireworksComponent),
                MockPipe(ArtemisTimeAgoPipe),
                MockPipe(HtmlForMarkdownPipe),
            ],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                MockProvider(LectureUnitService),
                MockProvider(AlertService),
                MockProvider(FeatureToggleService),
                MockProvider(CourseStorageService),
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
                { provide: Router, useValue: MockRouter },
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: AccountService, useClass: MockAccountService },
            ],
            schemas: [],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(CourseCompetenciesDetailsComponent);
                component = fixture.componentInstance;
                courseCompetencyService = TestBed.inject(CourseCompetencyService);
                const lectureUnitService = TestBed.inject(LectureUnitService);
                const featureToggleService = TestBed.inject(FeatureToggleService);
                jest.spyOn(featureToggleService, 'getFeatureToggleActive').mockReturnValue(of(true));
                setCompletionSpy = jest.spyOn(lectureUnitService, 'setCompletion');
                getProgressSpy = jest.spyOn(courseCompetencyService, 'getProgress');
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize', () => {
        fixture.detectChanges();
        expect(component).not.toBeNull();
    });

    it('should load competency to display progress and all lecture units', () => {
        const competency = {
            id: 1,
            lectureUnitLinks: [new CompetencyLectureUnitLink(this, new TextUnit(), 1)],
            exerciseLinks: [new CompetencyExerciseLink(this, { id: 5 } as TextExercise, 1)],
        } as Competency;
        const findByIdSpy = jest.spyOn(courseCompetencyService, 'findById').mockReturnValue(of(new HttpResponse({ body: competency })));

        fixture.detectChanges();

        const textUnit = fixture.debugElement.query(By.directive(TextUnitComponent));
        const exerciseUnit = fixture.debugElement.query(By.directive(ExerciseUnitComponent));

        expect(findByIdSpy).toHaveBeenCalledOnce();
        expect(component.competency.lectureUnitLinks).toHaveLength(2);
        expect(textUnit).not.toBeNull();
        expect(exerciseUnit).not.toBeNull();
    });

    it('should load competency to display progress and the exercise unit', () => {
        const competency = {
            id: 1,
            exerciseLinks: [new CompetencyExerciseLink(this, { id: 5 } as ModelingExercise, 1)],
        } as Competency;

        const findByIdSpy = jest.spyOn(courseCompetencyService, 'findById').mockReturnValue(of(new HttpResponse({ body: competency })));

        fixture.detectChanges();

        const exerciseUnit = fixture.debugElement.query(By.directive(ExerciseUnitComponent));

        expect(findByIdSpy).toHaveBeenCalledOnce();
        expect(component.competency.lectureUnitLinks).toHaveLength(1);
        expect(exerciseUnit).not.toBeNull();
    });

    it('should show fireworks when competency was mastered', fakeAsync(() => {
        const competency = {
            id: 1,
            userProgress: [
                {
                    progress: 100,
                    confidence: 100,
                } as CompetencyProgress,
            ],
        } as Competency;
        const findByIdSpy = jest.spyOn(courseCompetencyService, 'findById').mockReturnValue(of(new HttpResponse({ body: competency })));

        fixture.detectChanges();
        expect(findByIdSpy).toHaveBeenCalledOnce();
        expect(component.isMastered).toBeTrue();

        component.showFireworksIfMastered();

        tick(1000);
        expect(component.showFireworks).toBeTrue();

        tick(5000);
        expect(component.showFireworks).toBeFalse();
    }));

    it('should detect if due date is passed', () => {
        component.competency = { softDueDate: dayjs().add(1, 'days') } as Competency;
        fixture.detectChanges();
        expect(component.softDueDatePassed).toBeFalse();

        component.competency = { softDueDate: dayjs().subtract(1, 'days') } as Competency;
        fixture.detectChanges();
        expect(component.softDueDatePassed).toBeTrue();
    });

    it.each([
        { competency: { softDueDate: dayjs().add(1, 'days') } as Competency, expectedBadge: 'success' },
        { competency: { softDueDate: dayjs().subtract(1, 'days') } as Competency, expectedBadge: 'danger' },
    ])('should have [ngClass] resolve to correct date badge', ({ competency, expectedBadge }) => {
        component.competency = competency;
        fixture.detectChanges();
        const badge = fixture.debugElement.query(By.css('#date-badge')).nativeElement;
        expect(badge.classList).toContain('bg-' + expectedBadge);
    });

    it('should update progress after lecture unit completion', () => {
        component.competencyId = 42;
        component.courseId = 21;

        setCompletionSpy.mockReturnValue(of(new HttpResponse({ body: null })));
        const lectureUnitCompletionEvent = { lectureUnit: { id: 1, lecture: { id: 2 }, visibleToStudents: true, completed: false }, completed: true } as LectureUnitCompletionEvent;
        component.completeLectureUnit(lectureUnitCompletionEvent);

        expect(setCompletionSpy).toHaveBeenCalledOnce();
        expect(getProgressSpy).toHaveBeenCalledWith(42, 21, true);
    });
});
