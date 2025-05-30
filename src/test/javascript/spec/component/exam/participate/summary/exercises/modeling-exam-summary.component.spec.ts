import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Course } from 'app/entities/course.model';
import { ModelingExercise } from 'app/entities/modeling-exercise.model';
import { ModelingSubmission } from 'app/entities/modeling-submission.model';
import { ModelingExamSummaryComponent } from 'app/exam/overview/summary/exercises/modeling-exam-summary/modeling-exam-summary.component';
import { ModelingSubmissionComponent } from 'app/modeling/overview/modeling-submission.component';
import { UMLDiagramType } from '@ls1intum/apollon';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AccountService } from 'app/core/auth/account.service';
import { MockAccountService } from '../../../../../helpers/mocks/service/mock-account.service';
import { AlertService } from 'app/shared/service/alert.service';
import { MockProvider } from 'ng-mocks';
import { MockActivatedRoute } from '../../../../../helpers/mocks/activated-route/mock-activated-route';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from 'app/shared/layouts/profiles/profile.service';
import { MockProfileService } from '../../../../../helpers/mocks/service/mock-profile.service';
import { MockTranslateService } from '../../../../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';

describe('ModelingExamSummaryComponent', () => {
    let fixture: ComponentFixture<ModelingExamSummaryComponent>;
    let component: ModelingExamSummaryComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: AccountService, useClass: MockAccountService },
                MockProvider(AlertService),
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: ActivatedRoute, useValue: new MockActivatedRoute() },
                { provide: ProfileService, useClass: MockProfileService },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ModelingExamSummaryComponent);
                component = fixture.componentInstance;
            });
    });

    it('should initialize', () => {
        fixture.detectChanges();
        expect(ModelingExamSummaryComponent).not.toBeNull();
    });

    it('should show no submission when there is no uml model', () => {
        fixture.detectChanges();
        const el = fixture.debugElement.query((de) => de.nativeElement.textContent === 'No submission');
        expect(el).not.toBeNull();
        const modelingEditor = fixture.debugElement.query(By.directive(ModelingSubmissionComponent));
        expect(modelingEditor).toBeNull();
    });

    it('should show modeling submission when there is submission and exercise', () => {
        const mockSubmission = { explanationText: 'Test Explanation', model: JSON.stringify({ model: true }) } as ModelingSubmission;
        const course = new Course();
        const exercise = { course: course, exerciseGroup: undefined, diagramType: UMLDiagramType.ClassDiagram, studentParticipations: [{ id: 1 }] } as ModelingExercise;
        course.isAtLeastInstructor = true;
        component.exercise = exercise;
        component.submission = mockSubmission;

        fixture.detectChanges();

        const modelingSubmissionComponent = fixture.debugElement.query(By.directive(ModelingSubmissionComponent))?.componentInstance;
        expect(modelingSubmissionComponent).toBeTruthy();
    });

    it('should not show modeling submission when there is no submission or exercise', () => {
        fixture.detectChanges();

        const modelingSubmissionComponent = fixture.debugElement.query(By.directive(ModelingSubmissionComponent))?.componentInstance;
        expect(modelingSubmissionComponent).not.toBeTruthy();
    });
});
