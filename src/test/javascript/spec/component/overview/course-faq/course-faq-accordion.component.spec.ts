import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent, MockDirective } from 'ng-mocks';
import { CourseFaqAccordionComponent } from 'app/communication/course-faq/course-faq-accordion-component';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { CustomExerciseCategoryBadgeComponent } from 'app/shared/exercise-categories/custom-exercise-category-badge/custom-exercise-category-badge.component';
import { input } from '@angular/core';

describe('CourseFaqAccordionComponent', () => {
    let courseFaqAccordionComponent: CourseFaqAccordionComponent;
    let courseFaqAccordionComponentFixture: ComponentFixture<CourseFaqAccordionComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CourseFaqAccordionComponent, MockDirective(TranslateDirective), MockComponent(CustomExerciseCategoryBadgeComponent)],
        })
            .compileComponents()
            .then(() => {
                courseFaqAccordionComponentFixture = TestBed.createComponent(CourseFaqAccordionComponent);
                courseFaqAccordionComponent = courseFaqAccordionComponentFixture.componentInstance;
                TestBed.runInInjectionContext(() => (courseFaqAccordionComponent.faq = input({ id: 1, questionTitle: 'Title?', questionAnswer: 'Answer', categories: [] })));
            });
    });

    afterEach(() => {
        courseFaqAccordionComponent.ngOnDestroy();
        courseFaqAccordionComponentFixture.destroy();
    });

    it('should initialize', () => {
        courseFaqAccordionComponentFixture.detectChanges();
        expect(courseFaqAccordionComponent).not.toBeNull();
        courseFaqAccordionComponent.ngOnDestroy();
    });
});
