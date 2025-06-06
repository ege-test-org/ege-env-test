import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import dayjs from 'dayjs/esm';
import { JhiLanguageHelper } from 'app/core/language/shared/language.helper';
import { AccountService } from 'app/core/auth/account.service';
import { DebugElement } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { ParticipationWebsocketService } from 'app/course/shared/participation-websocket.service';
import { ProgrammingExerciseParticipationService } from 'app/programming/manage/services/programming-exercise-participation.service';
import { CommitState } from 'app/programming/shared/code-editor/model/code-editor.model';
import { MockAccountService } from '../../helpers/mocks/service/mock-account.service';
import { MockProgrammingExerciseParticipationService } from '../../helpers/mocks/service/mock-programming-exercise-participation.service';
import { ProgrammingSubmissionService } from 'app/programming/overview/programming-submission.service';
import { MockProgrammingSubmissionService } from '../../helpers/mocks/service/mock-programming-submission.service';
import { getElement } from '../../helpers/utils/general.utils';
import { WebsocketService } from 'app/shared/service/websocket.service';
import { MockWebsocketService } from '../../helpers/mocks/service/mock-websocket.service';
import { Participation } from 'app/entities/participation/participation.model';
import { ResultService } from 'app/exercise/result/result.service';
import { Result } from 'app/entities/result.model';
import { CodeEditorBuildLogService, CodeEditorRepositoryFileService, CodeEditorRepositoryService } from 'app/programming/shared/code-editor/service/code-editor-repository.service';
import { Feedback } from 'app/entities/feedback.model';
import { CodeEditorStudentContainerComponent } from 'app/programming/overview/code-editor-student-container.component';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { MockActivatedRouteWithSubjects } from '../../helpers/mocks/activated-route/mock-activated-route-with-subjects';
import { MockParticipationWebsocketService } from '../../helpers/mocks/service/mock-participation-websocket.service';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { MockResultService } from '../../helpers/mocks/service/mock-result.service';
import { MockCodeEditorRepositoryService } from '../../helpers/mocks/service/mock-code-editor-repository.service';
import { MockCodeEditorRepositoryFileService } from '../../helpers/mocks/service/mock-code-editor-repository-file.service';
import { MockCodeEditorBuildLogService } from '../../helpers/mocks/service/mock-code-editor-build-log.service';
import { MockComponent, MockModule, MockPipe } from 'ng-mocks';
import { CodeEditorContainerComponent } from 'app/programming/manage/code-editor/container/code-editor-container.component';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { IncludedInScoreBadgeComponent } from 'app/exercise/exercise-headers/included-in-score-badge.component';
import { CodeEditorRepositoryIsLockedComponent } from 'app/programming/shared/code-editor/layout/code-editor-repository-is-locked.component';
import { UpdatingResultComponent } from 'app/exercise/result/updating-result.component';
import { ProgrammingExerciseStudentTriggerBuildButtonComponent } from 'app/programming/shared/actions/programming-exercise-student-trigger-build-button.component';
import { ProgrammingExerciseInstructionComponent } from 'app/programming/shared/instructions-render/programming-exercise-instruction.component';
import { AdditionalFeedbackComponent } from 'app/exercise/additional-feedback/additional-feedback.component';
import { CodeEditorGridComponent } from 'app/programming/shared/code-editor/layout/code-editor-grid.component';
import { CodeEditorInstructionsComponent } from 'app/programming/shared/code-editor/instructions/code-editor-instructions.component';
import { KeysPipe } from 'app/shared/pipes/keys.pipe';
import { CodeEditorActionsComponent } from 'app/programming/shared/code-editor/actions/code-editor-actions.component';
import { CodeEditorFileBrowserComponent } from 'app/programming/manage/code-editor/file-browser/code-editor-file-browser.component';
import { CodeEditorBuildOutputComponent } from 'app/programming/manage/code-editor/build-output/code-editor-build-output.component';
import { CodeEditorFileBrowserCreateNodeComponent } from 'app/programming/manage/code-editor/file-browser/code-editor-file-browser-create-node.component';
import { CodeEditorFileBrowserFolderComponent } from 'app/programming/manage/code-editor/file-browser/code-editor-file-browser-folder.component';
import { CodeEditorFileBrowserFileComponent } from 'app/programming/manage/code-editor/file-browser/code-editor-file-browser-file.component';
import { CodeEditorStatusComponent } from 'app/programming/shared/code-editor/status/code-editor-status.component';
import { TreeViewComponent } from 'app/programming/shared/code-editor/treeview/components/treeview/tree-view.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CodeEditorMonacoComponent } from 'app/programming/shared/code-editor/monaco/code-editor-monaco.component';
import { mockCodeEditorMonacoViewChildren } from '../../helpers/mocks/mock-instance.helper';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';

describe('CodeEditorStudentIntegration', () => {
    let container: CodeEditorStudentContainerComponent;
    let containerFixture: ComponentFixture<CodeEditorStudentContainerComponent>;
    let containerDebugElement: DebugElement;
    let codeEditorRepositoryService: CodeEditorRepositoryService;
    let participationWebsocketService: ParticipationWebsocketService;
    let resultService: ResultService;
    let programmingExerciseParticipationService: ProgrammingExerciseParticipationService;
    let route: ActivatedRoute;

    let checkIfRepositoryIsCleanStub: jest.SpyInstance;
    let subscribeForLatestResultOfParticipationStub: jest.SpyInstance;
    let getFeedbackDetailsForResultStub: jest.SpyInstance;
    let getStudentParticipationWithLatestResultStub: jest.SpyInstance;

    let subscribeForLatestResultOfParticipationSubject: BehaviorSubject<Result | undefined>;
    let routeSubject: Subject<Params>;

    const result: Result = { id: 3, successful: false, completionDate: dayjs().subtract(2, 'days') };

    // Workaround for an error with MockComponent(). You can remove this once https://github.com/help-me-mom/ng-mocks/issues/8634 is resolved.
    mockCodeEditorMonacoViewChildren();

    beforeEach(() => {
        return TestBed.configureTestingModule({
            imports: [MockModule(NgbTooltipModule)],
            declarations: [
                CodeEditorStudentContainerComponent,
                CodeEditorContainerComponent,
                MockComponent(CodeEditorFileBrowserComponent),
                MockComponent(CodeEditorInstructionsComponent),
                CodeEditorRepositoryIsLockedComponent,
                MockPipe(KeysPipe),
                MockComponent(IncludedInScoreBadgeComponent),
                MockComponent(UpdatingResultComponent),
                MockComponent(ProgrammingExerciseStudentTriggerBuildButtonComponent),
                MockComponent(ProgrammingExerciseInstructionComponent),
                MockComponent(AdditionalFeedbackComponent),
                MockPipe(ArtemisTranslatePipe),
                MockComponent(CodeEditorGridComponent),
                MockComponent(CodeEditorActionsComponent),
                MockComponent(CodeEditorBuildOutputComponent),
                MockComponent(CodeEditorMonacoComponent),
                MockComponent(CodeEditorFileBrowserCreateNodeComponent),
                MockComponent(CodeEditorFileBrowserFolderComponent),
                MockComponent(CodeEditorFileBrowserFileComponent),
                MockComponent(CodeEditorStatusComponent),
                TreeViewComponent,
            ],
            providers: [
                JhiLanguageHelper,
                { provide: AccountService, useClass: MockAccountService },
                { provide: ActivatedRoute, useClass: MockActivatedRouteWithSubjects },
                { provide: WebsocketService, useClass: MockWebsocketService },
                { provide: ParticipationWebsocketService, useClass: MockParticipationWebsocketService },
                { provide: ProgrammingExerciseParticipationService, useClass: MockProgrammingExerciseParticipationService },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: ResultService, useClass: MockResultService },
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: CodeEditorRepositoryService, useClass: MockCodeEditorRepositoryService },
                { provide: CodeEditorRepositoryFileService, useClass: MockCodeEditorRepositoryFileService },
                { provide: CodeEditorBuildLogService, useClass: MockCodeEditorBuildLogService },
                { provide: ResultService, useClass: MockResultService },
                { provide: ProgrammingSubmissionService, useClass: MockProgrammingSubmissionService },
                { provide: TranslateService, useClass: MockTranslateService },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        })
            .compileComponents()
            .then(() => {
                containerFixture = TestBed.createComponent(CodeEditorStudentContainerComponent);
                container = containerFixture.componentInstance;
                containerDebugElement = containerFixture.debugElement;

                codeEditorRepositoryService = TestBed.inject(CodeEditorRepositoryService);
                participationWebsocketService = TestBed.inject(ParticipationWebsocketService);
                resultService = TestBed.inject(ResultService);
                programmingExerciseParticipationService = TestBed.inject(ProgrammingExerciseParticipationService);
                route = TestBed.inject(ActivatedRoute);

                subscribeForLatestResultOfParticipationSubject = new BehaviorSubject<Result | undefined>(undefined);

                routeSubject = new Subject<Params>();
                // @ts-ignore
                (route as MockActivatedRouteWithSubjects).setSubject(routeSubject);

                checkIfRepositoryIsCleanStub = jest.spyOn(codeEditorRepositoryService, 'getStatus');
                subscribeForLatestResultOfParticipationStub = jest
                    .spyOn(participationWebsocketService, 'subscribeForLatestResultOfParticipation')
                    .mockReturnValue(subscribeForLatestResultOfParticipationSubject);
                getFeedbackDetailsForResultStub = jest.spyOn(resultService, 'getFeedbackDetailsForResult');
                getStudentParticipationWithLatestResultStub = jest.spyOn(programmingExerciseParticipationService, 'getStudentParticipationWithLatestResult');
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();

        subscribeForLatestResultOfParticipationSubject = new BehaviorSubject<Result | undefined>(undefined);
        subscribeForLatestResultOfParticipationStub.mockReturnValue(subscribeForLatestResultOfParticipationSubject);

        routeSubject = new Subject<Params>();
        // @ts-ignore
        (route as MockActivatedRouteWithSubjects).setSubject(routeSubject);
    });

    it('should initialize correctly on route change if participation can be retrieved', () => {
        container.ngOnInit();
        const feedbacks = [{ id: 2 }] as Feedback[];
        result.feedbacks = feedbacks;
        const participation = { id: 1, results: [result], exercise: { id: 99 } } as Participation;
        const findWithLatestResultSubject = new Subject<Participation>();
        getStudentParticipationWithLatestResultStub.mockReturnValue(findWithLatestResultSubject);

        routeSubject.next({ participationId: 1 });

        expect(container.loadingParticipation).toBeTrue();

        findWithLatestResultSubject.next(participation);

        expect(getStudentParticipationWithLatestResultStub).toHaveBeenNthCalledWith(1, participation.id);
        expect(container.loadingParticipation).toBeFalse();
        expect(container.participationCouldNotBeFetched).toBeFalse();
        expect(container.participation).toEqual({ ...participation, results: [{ ...result, feedbacks }] });
    });

    // TODO re-enable after remove-gitalb issues are resolved
    it.skip('should show the repository locked badge and disable the editor actions if the participation is locked', () => {
        container.ngOnInit();
        const participation = {
            id: 1,
            results: [result],
            exercise: { id: 99, dueDate: dayjs().subtract(2, 'hours') } as ProgrammingExercise,
            locked: true,
        } as any;
        const feedbacks = [{ id: 2 }] as Feedback[];
        const findWithLatestResultSubject = new Subject<Participation>();
        const getFeedbackDetailsForResultSubject = new Subject<{ body: Feedback[] }>();
        const isCleanSubject = new Subject();
        getStudentParticipationWithLatestResultStub.mockReturnValue(findWithLatestResultSubject);
        getFeedbackDetailsForResultStub.mockReturnValue(getFeedbackDetailsForResultSubject);
        checkIfRepositoryIsCleanStub.mockReturnValue(isCleanSubject);

        routeSubject.next({ participationId: 1 });
        findWithLatestResultSubject.next(participation);
        getFeedbackDetailsForResultSubject.next({ body: feedbacks });

        containerFixture.detectChanges();
        isCleanSubject.next({ repositoryStatus: CommitState.CLEAN });

        // Repository should be locked, the student can't write into it anymore.
        expect(container.repositoryIsLocked).toBeTrue();
        expect(getElement(containerDebugElement, '.locked-container').innerHTML).toContain('fa-icon');
        expect(container.codeEditorContainer.fileBrowser.disableActions).toBeTrue();
        expect(container.codeEditorContainer.actions.disableActions).toBeTrue();
    });

    it('should abort initialization and show error state if participation cannot be retrieved', () => {
        container.ngOnInit();
        const findWithLatestResultSubject = new Subject<{ body: Participation }>();
        getStudentParticipationWithLatestResultStub.mockReturnValue(findWithLatestResultSubject);

        routeSubject.next({ participationId: 1 });

        expect(container.loadingParticipation).toBeTrue();

        findWithLatestResultSubject.error('fatal error');

        expect(container.loadingParticipation).toBeFalse();
        expect(container.participationCouldNotBeFetched).toBeTrue();
        expect(getFeedbackDetailsForResultStub).not.toHaveBeenCalled();
        expect(container.participation).toBeUndefined();
    });
});
