import { Course } from 'app/entities/course.model';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApollonDiagramService } from 'app/quiz/manage/apollon-diagrams/apollon-diagram.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MockProvider } from 'ng-mocks';
import { MockNgbModalService } from '../../helpers/mocks/service/mock-ngb-modal.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { AlertService } from 'app/shared/service/alert.service';
import { SortService } from 'app/shared/service/sort.service';
import { ApollonDiagramListComponent } from 'app/quiz/manage/apollon-diagrams/apollon-diagram-list.component';
import { ApollonDiagram } from 'app/entities/apollon-diagram.model';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { CourseManagementService } from 'app/course/manage/course-management.service';
import { AccountService } from 'app/core/auth/account.service';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import { UMLDiagramType } from '@ls1intum/apollon';

describe('ApollonDiagramList Component', () => {
    let apollonDiagramService: ApollonDiagramService;
    let courseService: CourseManagementService;
    let modalService: NgbModal;
    let fixture: ComponentFixture<ApollonDiagramListComponent>;

    const course: Course = { id: 123 } as Course;

    beforeEach(() => {
        const route = { params: of({ courseId: 123 }), snapshot: { paramMap: convertToParamMap({ courseId: course.id }) } } as any as ActivatedRoute;

        TestBed.configureTestingModule({
            imports: [ApollonDiagramListComponent],
            declarations: [],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                AlertService,
                ApollonDiagramService,
                MockProvider(SortService),
                { provide: NgbModal, useClass: MockNgbModalService },
                { provide: ActivatedRoute, useValue: route },
                { provide: TranslateService, useClass: MockTranslateService },
                MockProvider(CourseManagementService),
                MockProvider(AccountService),
            ],
            schemas: [],
        })
            .overrideTemplate(ApollonDiagramListComponent, '')
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ApollonDiagramListComponent);
                const injector = fixture.debugElement.injector;
                apollonDiagramService = injector.get(ApollonDiagramService);
                courseService = injector.get(CourseManagementService);
                modalService = injector.get(NgbModal);
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('ngOnInit', () => {
        const apollonDiagrams: ApollonDiagram[] = [new ApollonDiagram(UMLDiagramType.ClassDiagram, course.id!), new ApollonDiagram(UMLDiagramType.ActivityDiagram, course.id!)];
        const diagramResponse: HttpResponse<ApollonDiagram[]> = new HttpResponse({ body: apollonDiagrams });
        const courseResponse: HttpResponse<Course> = new HttpResponse({ body: course });

        jest.spyOn(apollonDiagramService, 'getDiagramsByCourse').mockReturnValue(of(diagramResponse));
        jest.spyOn(courseService, 'find').mockReturnValue(of(courseResponse));

        // test
        fixture.componentInstance.ngOnInit();
        expect(isEqual(fixture.componentInstance.apollonDiagrams, apollonDiagrams)).toBeTruthy();
    });

    it('delete', () => {
        // setup
        const response: HttpResponse<void> = new HttpResponse();
        jest.spyOn(apollonDiagramService, 'delete').mockReturnValue(of(response));

        const apollonDiagrams = [];
        for (let i = 0; i < 3; i++) {
            const apollonDiagram = new ApollonDiagram(UMLDiagramType.ClassDiagram, course.id!);
            apollonDiagram.id = i;
            apollonDiagrams.push(apollonDiagram);
        }

        const diagramToDelete = apollonDiagrams[0];
        fixture.componentInstance.apollonDiagrams = apollonDiagrams;
        fixture.componentInstance.delete(diagramToDelete);
        expect(fixture.componentInstance.apollonDiagrams.find((diagram) => diagram.id === diagramToDelete.id)).toBeFalsy();
    });

    it('openCreateDiagramDialog', () => {
        const openModalSpy = jest.spyOn(modalService, 'open');
        fixture.componentInstance.openCreateDiagramDialog(course.id!);
        expect(openModalSpy).toHaveBeenCalledOnce();
    });

    it('getTitleForApollonDiagram', () => {
        const apollonDiagram = new ApollonDiagram(UMLDiagramType.ClassDiagram, course.id!);
        apollonDiagram.title = 'Title ';
        expect(fixture.componentInstance.getTitleForApollonDiagram(apollonDiagram)).toBe('Title');
    });

    it('handleOpenDialogClick', () => {
        const emitOpenDiagramSpy = jest.spyOn(fixture.componentInstance.openDiagram, 'emit');
        fixture.componentInstance.handleOpenDialogClick(1);
        expect(emitOpenDiagramSpy).toHaveBeenCalledWith(1);
    });

    it('handleCloseDiagramClick', () => {
        const emitCloseDialog = jest.spyOn(fixture.componentInstance.closeDialog, 'emit');
        fixture.componentInstance.handleCloseDiagramClick();
        expect(emitCloseDialog).toHaveBeenCalledOnce();
    });
});
