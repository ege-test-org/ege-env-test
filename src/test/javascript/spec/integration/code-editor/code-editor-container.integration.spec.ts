import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import dayjs from 'dayjs/esm';
import { DebugElement } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, firstValueFrom, of } from 'rxjs';
import { ParticipationWebsocketService } from 'app/course/shared/participation-websocket.service';
import { ProgrammingExerciseParticipationService } from 'app/programming/manage/services/programming-exercise-participation.service';
import {
    CommitState,
    DeleteFileChange,
    DomainType,
    EditorState,
    FileBadge,
    FileBadgeType,
    FileType,
    GitConflictState,
} from 'app/programming/shared/code-editor/model/code-editor.model';
import { buildLogs, extractedBuildLogErrors, extractedErrorFiles } from '../../helpers/sample/build-logs';
import { problemStatement } from '../../helpers/sample/problemStatement.json';
import { MockProgrammingExerciseParticipationService } from '../../helpers/mocks/service/mock-programming-exercise-participation.service';
import { ProgrammingSubmissionService, ProgrammingSubmissionState, ProgrammingSubmissionStateObj } from 'app/programming/overview/programming-submission.service';
import { MockProgrammingSubmissionService } from '../../helpers/mocks/service/mock-programming-submission.service';
import { GuidedTourService } from 'app/core/guided-tour/guided-tour.service';
import { WebsocketService } from 'app/shared/service/websocket.service';
import { MockWebsocketService } from '../../helpers/mocks/service/mock-websocket.service';
import { Participation } from 'app/entities/participation/participation.model';
import { BuildLogEntryArray } from 'app/entities/programming/build-log.model';
import { CodeEditorConflictStateService } from 'app/programming/shared/code-editor/service/code-editor-conflict-state.service';
import { ResultService } from 'app/exercise/result/result.service';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import { Result } from 'app/entities/result.model';
import { CodeEditorBuildLogService, CodeEditorRepositoryFileService, CodeEditorRepositoryService } from 'app/programming/shared/code-editor/service/code-editor-repository.service';
import { Feedback } from 'app/entities/feedback.model';
import { DomainService } from 'app/programming/shared/code-editor/service/code-editor-domain.service';
import { ProgrammingSubmission } from 'app/entities/programming/programming-submission.model';
import { MockActivatedRouteWithSubjects } from '../../helpers/mocks/activated-route/mock-activated-route-with-subjects';
import { MockParticipationWebsocketService } from '../../helpers/mocks/service/mock-participation-websocket.service';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { MockResultService } from '../../helpers/mocks/service/mock-result.service';
import { MockCodeEditorRepositoryService } from '../../helpers/mocks/service/mock-code-editor-repository.service';
import { MockCodeEditorRepositoryFileService } from '../../helpers/mocks/service/mock-code-editor-repository-file.service';
import { MockCodeEditorBuildLogService } from '../../helpers/mocks/service/mock-code-editor-build-log.service';
import { CodeEditorContainerComponent } from 'app/programming/manage/code-editor/container/code-editor-container.component';
import { omit } from 'lodash-es';
import { ProgrammingLanguage, ProjectType } from 'app/entities/programming/programming-exercise.model';
import { MockComponent, MockProvider } from 'ng-mocks';
import { CodeEditorHeaderComponent } from 'app/programming/manage/code-editor/header/code-editor-header.component';
import { AlertService } from 'app/shared/service/alert.service';
import { MockResizeObserver } from '../../helpers/mocks/service/mock-resize-observer';
import { CodeEditorMonacoComponent } from 'app/programming/shared/code-editor/monaco/code-editor-monaco.component';
import { MonacoEditorComponent } from '../../../../../main/webapp/app/shared/monaco-editor/monaco-editor.component';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { ProfileService } from 'app/shared/layouts/profiles/profile.service';
import { MockProfileService } from '../../helpers/mocks/service/mock-profile.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GuidedTourMapping } from 'app/core/guided-tour/guided-tour-setting.model';

describe('CodeEditorContainerIntegration', () => {
    let container: CodeEditorContainerComponent;
    let containerFixture: ComponentFixture<CodeEditorContainerComponent>;
    let containerDebugElement: DebugElement;
    let conflictService: CodeEditorConflictStateService;
    let domainService: DomainService;
    let checkIfRepositoryIsCleanStub: jest.SpyInstance;
    let getRepositoryContentStub: jest.SpyInstance;
    let subscribeForLatestResultOfParticipationStub: jest.SpyInstance;
    let getFeedbackDetailsForResultStub: jest.SpyInstance;
    let getBuildLogsStub: jest.SpyInstance;
    let getFileStub: jest.SpyInstance;
    let saveFilesStub: jest.SpyInstance;
    let commitStub: jest.SpyInstance;
    let getStudentParticipationWithLatestResultStub: jest.SpyInstance;
    let getLatestPendingSubmissionStub: jest.SpyInstance;
    let guidedTourService: GuidedTourService;
    let subscribeForLatestResultOfParticipationSubject: BehaviorSubject<Result | undefined>;
    let getLatestPendingSubmissionSubject = new Subject<ProgrammingSubmissionStateObj>();

    const result = { id: 3, successful: false, completionDate: dayjs().subtract(2, 'days') };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                CodeEditorConflictStateService,
                MockProvider(AlertService),
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
                { provide: ProfileService, useClass: MockProfileService },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        })
            .overrideComponent(CodeEditorMonacoComponent, { set: { imports: [MonacoEditorComponent, MockComponent(CodeEditorHeaderComponent)] } })
            .compileComponents();

        containerFixture = TestBed.createComponent(CodeEditorContainerComponent);
        container = containerFixture.componentInstance;
        containerDebugElement = containerFixture.debugElement;
        guidedTourService = TestBed.inject(GuidedTourService);

        const codeEditorRepositoryService = containerDebugElement.injector.get(CodeEditorRepositoryService);
        const codeEditorRepositoryFileService = containerDebugElement.injector.get(CodeEditorRepositoryFileService);
        const participationWebsocketService = containerDebugElement.injector.get(ParticipationWebsocketService);
        const resultService = containerDebugElement.injector.get(ResultService);
        const buildLogService = containerDebugElement.injector.get(CodeEditorBuildLogService);
        const programmingExerciseParticipationService = containerDebugElement.injector.get(ProgrammingExerciseParticipationService);
        conflictService = containerDebugElement.injector.get(CodeEditorConflictStateService);
        domainService = containerDebugElement.injector.get(DomainService);
        const submissionService = containerDebugElement.injector.get(ProgrammingSubmissionService);

        subscribeForLatestResultOfParticipationSubject = new BehaviorSubject<Result | undefined>(undefined);

        getLatestPendingSubmissionSubject = new Subject<ProgrammingSubmissionStateObj>();

        checkIfRepositoryIsCleanStub = jest.spyOn(codeEditorRepositoryService, 'getStatus');
        getRepositoryContentStub = jest.spyOn(codeEditorRepositoryFileService, 'getRepositoryContent');
        subscribeForLatestResultOfParticipationStub = jest
            .spyOn(participationWebsocketService, 'subscribeForLatestResultOfParticipation')
            .mockReturnValue(subscribeForLatestResultOfParticipationSubject);
        getFeedbackDetailsForResultStub = jest.spyOn(resultService, 'getFeedbackDetailsForResult');
        getBuildLogsStub = jest.spyOn(buildLogService, 'getBuildLogs');
        getFileStub = jest.spyOn(codeEditorRepositoryFileService, 'getFile');
        saveFilesStub = jest.spyOn(codeEditorRepositoryFileService, 'updateFiles');
        commitStub = jest.spyOn(codeEditorRepositoryService, 'commit');
        getStudentParticipationWithLatestResultStub = jest.spyOn(programmingExerciseParticipationService, 'getStudentParticipationWithLatestResult');
        getLatestPendingSubmissionStub = jest.spyOn(submissionService, 'getLatestPendingSubmissionByParticipationId').mockReturnValue(getLatestPendingSubmissionSubject);
        // Mock the ResizeObserver, which is not available in the test environment
        global.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
            return new MockResizeObserver(callback);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        subscribeForLatestResultOfParticipationSubject = new BehaviorSubject<Result | undefined>(undefined);
        subscribeForLatestResultOfParticipationStub.mockReturnValue(subscribeForLatestResultOfParticipationSubject);

        getLatestPendingSubmissionSubject = new Subject<ProgrammingSubmissionStateObj>();
        getLatestPendingSubmissionStub.mockReturnValue(getLatestPendingSubmissionSubject);
    });

    const cleanInitialize = () => {
        const exercise = { id: 1, problemStatement };
        const participation = { id: 2, exercise, student: { id: 99 }, results: [result] } as StudentParticipation;
        const isCleanSubject = new Subject();
        const getRepositoryContentSubject = new Subject();
        const getBuildLogsSubject = new Subject();
        checkIfRepositoryIsCleanStub.mockReturnValue(isCleanSubject);
        getRepositoryContentStub.mockReturnValue(getRepositoryContentSubject);
        getFeedbackDetailsForResultStub.mockReturnValue(of([]));
        getBuildLogsStub.mockReturnValue(getBuildLogsSubject);
        getLatestPendingSubmissionStub.mockReturnValue(getLatestPendingSubmissionSubject);

        container.participation = participation as any;

        // TODO: This should be replaced by testing with route params.
        domainService.setDomain([DomainType.PARTICIPATION, participation]);
        containerFixture.detectChanges();

        container.commitState = CommitState.UNDEFINED;

        isCleanSubject.next({ repositoryStatus: CommitState.CLEAN });
        getBuildLogsSubject.next(buildLogs);
        getRepositoryContentSubject.next({ file: FileType.FILE, folder: FileType.FOLDER, file2: FileType.FILE });
        getLatestPendingSubmissionSubject.next({ participationId: 1, submissionState: ProgrammingSubmissionState.HAS_NO_PENDING_SUBMISSION, submission: undefined });

        containerFixture.detectChanges();

        // container
        expect(container.commitState).toBe(CommitState.CLEAN);
        expect(container.editorState).toBe(EditorState.CLEAN);
        expect(container.buildOutput.isBuilding).toBeFalse();
        expect(container.unsavedFiles).toStrictEqual({});

        // file browser
        expect(checkIfRepositoryIsCleanStub).toHaveBeenCalledOnce();
        expect(getRepositoryContentStub).toHaveBeenCalledOnce();
        expect(container.fileBrowser.errorFiles).toEqual(extractedErrorFiles);
        expect(container.fileBrowser.unsavedFiles).toHaveLength(0);

        // monaco editor
        expect(container.monacoEditor.loadingCount()).toBe(0);
        expect(container.monacoEditor.commitState()).toBe(CommitState.CLEAN);

        // actions
        expect(container.actions.commitState).toBe(CommitState.CLEAN);
        expect(container.actions.editorState).toBe(EditorState.CLEAN);
        expect(container.actions.isBuilding).toBeFalse();

        // status
        expect(container.fileBrowser.status.commitState).toBe(CommitState.CLEAN);
        expect(container.fileBrowser.status.editorState).toBe(EditorState.CLEAN);

        // build output
        expect(getBuildLogsStub).toHaveBeenCalledOnce();
        expect(container.buildOutput.rawBuildLogs.extractErrors(ProgrammingLanguage.JAVA, ProjectType.PLAIN_MAVEN)).toEqual(extractedBuildLogErrors);
        expect(container.buildOutput.isBuilding).toBeFalse();

        // instructions
        expect(container.instructions).toBeDefined(); // Have to use this as it's a component

        // called by build output
        expect(getFeedbackDetailsForResultStub).toHaveBeenCalledOnce();
        expect(getFeedbackDetailsForResultStub).toHaveBeenCalledWith(participation.id!, participation.results![0]);
    };

    const loadFile = async (fileName: string, fileContent: string) => {
        getFileStub.mockReturnValue(of({ fileContent }));
        container.fileBrowser.selectedFile = fileName;
        await container.monacoEditor.selectFileInEditor(fileName);
    };

    it('should initialize all components correctly if all server calls are successful', fakeAsync(() => {
        cleanInitialize();
        flush();
        discardPeriodicTasks();
        expect(subscribeForLatestResultOfParticipationStub).toHaveBeenCalledOnce();
    }));

    it('should not load files and render other components correctly if the repository status cannot be retrieved', fakeAsync(() => {
        const exercise = { id: 1, problemStatement, course: { id: 2 } };
        const participation = { id: 2, exercise, results: [result] } as StudentParticipation;
        const isCleanSubject = new Subject();
        const getBuildLogsSubject = new Subject();
        checkIfRepositoryIsCleanStub.mockReturnValue(isCleanSubject);
        subscribeForLatestResultOfParticipationStub.mockReturnValue(of(undefined));
        getFeedbackDetailsForResultStub.mockReturnValue(of([]));
        getBuildLogsStub.mockReturnValue(getBuildLogsSubject);

        container.participation = participation;

        // TODO: This should be replaced by testing with route params.
        domainService.setDomain([DomainType.PARTICIPATION, participation]);
        containerFixture.detectChanges();

        container.commitState = CommitState.UNDEFINED;

        isCleanSubject.error('fatal error');
        getBuildLogsSubject.next(buildLogs);
        getLatestPendingSubmissionSubject.next({ participationId: 1, submissionState: ProgrammingSubmissionState.HAS_FAILED_SUBMISSION, submission: undefined });

        containerFixture.detectChanges();

        // container
        expect(container.commitState).toBe(CommitState.COULD_NOT_BE_RETRIEVED);
        expect(container.editorState).toBe(EditorState.CLEAN);
        expect(container.buildOutput.isBuilding).toBeFalse();
        expect(container.unsavedFiles).toStrictEqual({});

        // file browser
        expect(checkIfRepositoryIsCleanStub).toHaveBeenCalledOnce();
        expect(getRepositoryContentStub).not.toHaveBeenCalled();
        expect(container.fileBrowser.errorFiles).toEqual(extractedErrorFiles);
        expect(container.fileBrowser.unsavedFiles).toHaveLength(0);

        // monaco editor
        expect(container.monacoEditor.loadingCount()).toBe(0);
        expect(container.monacoEditor.annotationsArray?.map((a) => omit(a, 'hash'))).toEqual(extractedBuildLogErrors);
        expect(container.monacoEditor.commitState()).toBe(CommitState.COULD_NOT_BE_RETRIEVED);

        // actions
        expect(container.actions.commitState).toBe(CommitState.COULD_NOT_BE_RETRIEVED);
        expect(container.actions.editorState).toBe(EditorState.CLEAN);
        expect(container.actions.isBuilding).toBeFalse();

        // status
        expect(container.fileBrowser.status.commitState).toBe(CommitState.COULD_NOT_BE_RETRIEVED);
        expect(container.fileBrowser.status.editorState).toBe(EditorState.CLEAN);

        // build output
        expect(getBuildLogsStub).toHaveBeenCalledOnce();
        expect(container.buildOutput.rawBuildLogs.extractErrors(ProgrammingLanguage.JAVA, ProjectType.PLAIN_MAVEN)).toEqual(extractedBuildLogErrors);
        expect(container.buildOutput.isBuilding).toBeFalse();

        // instructions
        expect(container.instructions).toBeDefined(); // Have to use this as it's a component

        // called by build output & instructions
        expect(getFeedbackDetailsForResultStub).toHaveBeenCalledOnce();
        expect(getFeedbackDetailsForResultStub).toHaveBeenCalledWith(participation.id!, participation.results![0]);

        flush();
        discardPeriodicTasks();
        expect(subscribeForLatestResultOfParticipationStub).toHaveBeenCalledOnce();
    }));

    it('should update the file browser and monaco editor on file selection', async () => {
        cleanInitialize();
        const selectedFile = Object.keys(container.fileBrowser.repositoryFiles)[0];
        const fileContent = 'lorem ipsum';
        await loadFile(selectedFile, fileContent);

        containerFixture.detectChanges();
        expect(container.selectedFile).toBe(selectedFile);
        expect(container.monacoEditor.selectedFile()).toBe(selectedFile);
        expect(container.monacoEditor.loadingCount()).toBe(0);
        expect(container.monacoEditor.fileSession()).toContainKey(selectedFile);
        expect(getFileStub).toHaveBeenCalledOnce();
        expect(getFileStub).toHaveBeenCalledWith(selectedFile);

        containerFixture.detectChanges();
        expect(container.getText()).toBe(fileContent);
    });

    it('should mark file to have unsaved changes in file tree if the file was changed in editor', async () => {
        cleanInitialize();
        const selectedFile = Object.keys(container.fileBrowser.repositoryFiles)[0];
        const fileContent = 'lorem ipsum';
        const newFileContent = 'new lorem ipsum';
        await loadFile(selectedFile, fileContent);

        containerFixture.detectChanges();
        container.monacoEditor.onFileTextChanged(newFileContent);
        containerFixture.detectChanges();

        expect(getFileStub).toHaveBeenCalledOnce();
        expect(getFileStub).toHaveBeenCalledWith(selectedFile);
        expect(container.unsavedFiles).toEqual({ [selectedFile]: newFileContent });
        expect(container.fileBrowser.unsavedFiles).toEqual([selectedFile]);
        expect(container.editorState).toBe(EditorState.UNSAVED_CHANGES);
        expect(container.actions.editorState).toBe(EditorState.UNSAVED_CHANGES);
    });

    it('should save files and remove unsaved status of saved files afterwards', async () => {
        // setup
        cleanInitialize();
        const selectedFile = Object.keys(container.fileBrowser.repositoryFiles)[0];
        const otherFileWithUnsavedChanges = Object.keys(container.fileBrowser.repositoryFiles)[2];
        const fileContent = 'lorem ipsum';
        const newFileContent = 'new lorem ipsum';
        const saveFilesSubject = new Subject();
        saveFilesStub.mockReturnValue(saveFilesSubject);
        container.unsavedFiles = { [otherFileWithUnsavedChanges]: 'lorem ipsum dolet', [selectedFile]: newFileContent };
        await loadFile(selectedFile, fileContent);
        containerFixture.detectChanges();

        // init saving
        container.actions.saveChangedFiles().subscribe();
        expect(container.commitState).toBe(CommitState.UNCOMMITTED_CHANGES);
        expect(container.editorState).toBe(EditorState.SAVING);

        // emit saving result
        saveFilesSubject.next({ [selectedFile]: undefined, [otherFileWithUnsavedChanges]: undefined });
        containerFixture.detectChanges();

        // check if saving result updates comps as expected
        expect(container.unsavedFiles).toStrictEqual({});
        expect(container.editorState).toBe(EditorState.CLEAN);
        expect(container.commitState).toBe(CommitState.UNCOMMITTED_CHANGES);
        expect(container.fileBrowser.unsavedFiles).toHaveLength(0);
        expect(container.actions.editorState).toBe(EditorState.CLEAN);
    });

    it('should remove the unsaved changes flag in all components if the unsaved file is deleted', () => {
        cleanInitialize();
        const repositoryFiles = { file: FileType.FILE, file2: FileType.FILE, folder: FileType.FOLDER };
        const expectedFilesAfterDelete = { file2: FileType.FILE, folder: FileType.FOLDER };
        const unsavedChanges = { file: 'lorem ipsum' };
        container.fileBrowser.repositoryFiles = repositoryFiles;
        container.unsavedFiles = unsavedChanges;

        containerFixture.detectChanges();

        expect(container.fileBrowser.unsavedFiles).toEqual(Object.keys(unsavedChanges));
        expect(container.actions.editorState).toBe(EditorState.UNSAVED_CHANGES);

        container.fileBrowser.onFileDeleted(new DeleteFileChange(FileType.FILE, 'file'));
        containerFixture.detectChanges();
        expect(container.unsavedFiles).toStrictEqual({});
        expect(container.fileBrowser.repositoryFiles).toEqual(expectedFilesAfterDelete);
        expect(container.actions.editorState).toBe(EditorState.CLEAN);
    });

    it('should wait for build result after submission if no unsaved changes exist', () => {
        cleanInitialize();
        const successfulSubmission = { id: 1, buildFailed: false } as ProgrammingSubmission;
        const successfulResult = { id: 4, successful: true, feedbacks: [] as Feedback[], participation: { id: 3 } } as Result;
        successfulResult.submission = successfulSubmission;
        const expectedBuildLog = new BuildLogEntryArray();
        expect(container.unsavedFiles).toStrictEqual({});
        container.commitState = CommitState.UNCOMMITTED_CHANGES;
        containerFixture.detectChanges();

        // commit
        expect(container.actions.commitState).toBe(CommitState.UNCOMMITTED_CHANGES);
        commitStub.mockReturnValue(of(undefined));
        getLatestPendingSubmissionSubject.next({
            submissionState: ProgrammingSubmissionState.IS_BUILDING_PENDING_SUBMISSION,
            submission: {} as ProgrammingSubmission,
            participationId: successfulResult!.participation!.id!,
        });
        container.actions.commit();
        containerFixture.detectChanges();

        // waiting for build successfulResult
        expect(container.commitState).toBe(CommitState.CLEAN);
        expect(container.buildOutput.isBuilding).toBeTrue();

        getLatestPendingSubmissionSubject.next({
            submissionState: ProgrammingSubmissionState.HAS_NO_PENDING_SUBMISSION,
            submission: undefined,
            participationId: successfulResult!.participation!.id!,
        });
        subscribeForLatestResultOfParticipationSubject.next(successfulResult);
        containerFixture.detectChanges();

        expect(container.buildOutput.isBuilding).toBeFalse();
        expect(container.buildOutput.rawBuildLogs).toEqual(expectedBuildLog);
        expect(container.fileBrowser.errorFiles).toHaveLength(0);
    });

    it('should first save unsaved files before triggering commit', async () => {
        cleanInitialize();
        const successfulSubmission = { id: 1, buildFailed: false } as ProgrammingSubmission;
        const successfulResult = { id: 4, successful: true, feedbacks: [] as Feedback[], participation: { id: 3 } } as Result;
        successfulResult.submission = successfulSubmission;
        const expectedBuildLog = new BuildLogEntryArray();
        const unsavedFile = Object.keys(container.fileBrowser.repositoryFiles)[0];
        const saveFilesSubject = new Subject();
        saveFilesStub.mockReturnValue(saveFilesSubject);
        container.unsavedFiles = { [unsavedFile]: 'lorem ipsum' };
        container.editorState = EditorState.UNSAVED_CHANGES;
        container.commitState = CommitState.UNCOMMITTED_CHANGES;
        containerFixture.detectChanges();

        // trying to commit
        container.actions.commit();
        containerFixture.detectChanges();

        // saving before commit
        expect(saveFilesStub).toHaveBeenCalledOnce();
        expect(saveFilesStub).toHaveBeenCalledWith([{ fileName: unsavedFile, fileContent: 'lorem ipsum' }], true);
        expect(container.editorState).toBe(EditorState.SAVING);
        expect(container.fileBrowser.status.editorState).toBe(EditorState.SAVING);
        // committing
        expect(commitStub).not.toHaveBeenCalled();
        expect(container.commitState).toBe(CommitState.COMMITTING);
        expect(container.fileBrowser.status.commitState).toBe(CommitState.COMMITTING);
        saveFilesSubject.next({ [unsavedFile]: undefined });

        expect(container.editorState).toBe(EditorState.CLEAN);
        subscribeForLatestResultOfParticipationSubject.next(successfulResult);
        getLatestPendingSubmissionSubject.next({
            submissionState: ProgrammingSubmissionState.IS_BUILDING_PENDING_SUBMISSION,
            submission: {} as ProgrammingSubmission,
            participationId: successfulResult!.participation!.id!,
        });

        // Commit state should change asynchronously
        containerFixture.detectChanges();
        await firstValueFrom(container.actions.commitStateChange);

        // waiting for build result
        expect(container.commitState).toBe(CommitState.CLEAN);
        expect(container.buildOutput.isBuilding).toBeTrue();

        getLatestPendingSubmissionSubject.next({
            submissionState: ProgrammingSubmissionState.HAS_NO_PENDING_SUBMISSION,
            submission: undefined,
            participationId: successfulResult!.participation!.id!,
        });
        containerFixture.detectChanges();

        expect(container.buildOutput.isBuilding).toBeFalse();
        expect(container.buildOutput.rawBuildLogs).toEqual(expectedBuildLog);
        expect(container.fileBrowser.errorFiles).toHaveLength(0);

        containerFixture.destroy();
    });

    it('should enter conflict mode if a git conflict between local and remote arises', fakeAsync(() => {
        const guidedTourMapping = {} as GuidedTourMapping;
        jest.spyOn<any, any>(guidedTourService, 'checkTourState').mockReturnValue(true);
        guidedTourService.guidedTourMapping = guidedTourMapping;

        const successfulResult = { id: 3, successful: false };
        const participation = { id: 1, results: [successfulResult], exercise: { id: 99 } } as StudentParticipation;
        const feedbacks = [{ id: 2 }] as Feedback[];
        const findWithLatestResultSubject = new Subject<Participation>();
        const isCleanSubject = new Subject();
        getStudentParticipationWithLatestResultStub.mockReturnValue(findWithLatestResultSubject);
        checkIfRepositoryIsCleanStub.mockReturnValue(isCleanSubject);
        getFeedbackDetailsForResultStub.mockReturnValue(of(feedbacks));
        getRepositoryContentStub.mockReturnValue(of([]));

        container.participation = participation;
        domainService.setDomain([DomainType.PARTICIPATION, participation]);

        containerFixture.detectChanges();

        findWithLatestResultSubject.next(participation);

        containerFixture.detectChanges();

        // Create conflict.
        isCleanSubject.next({ repositoryStatus: CommitState.CONFLICT });
        containerFixture.detectChanges();

        expect(container.commitState).toBe(CommitState.CONFLICT);
        expect(getRepositoryContentStub).not.toHaveBeenCalled();

        // Resolve conflict.
        conflictService.notifyConflictState(GitConflictState.OK);
        tick();
        containerFixture.detectChanges();
        isCleanSubject.next({ repositoryStatus: CommitState.CLEAN });
        containerFixture.detectChanges();

        expect(container.commitState).toBe(CommitState.CLEAN);
        expect(getRepositoryContentStub).toHaveBeenCalledOnce();

        containerFixture.destroy();
        flush();
    }));

    it.each([
        ['loadingFailed', 'artemisApp.editor.errors.loadingFailed', { connectionIssue: '' }],
        ['loadingFailedInternetDisconnected', 'artemisApp.editor.errors.loadingFailed', { connectionIssue: 'artemisApp.editor.errors.InternetDisconnected' }],
    ])('onError should handle disconnectedInternet', (error: string, errorKey: string, translationParams: { connectionIssue: string }) => {
        const alertService = TestBed.inject(AlertService);
        const alertServiceSpy = jest.spyOn(alertService, 'error');
        container.onError(error);
        expect(alertServiceSpy).toHaveBeenCalledWith(errorKey, translationParams);
    });

    it('should create file badges for feedback suggestions', () => {
        container.feedbackSuggestions = [
            { reference: 'file:src/Test1.java_line:2' },
            { reference: 'file:src/Test2.java_line:2' },
            { reference: 'file:src/Test2.java_line:4' },
            { reference: 'file:src/Test3.java_line:4' },
            { reference: 'file:src/Test3.java_line:10' },
            { reference: 'file:src/Test3.java_line:11' },
        ];
        container.updateFileBadges();
        expect(container.fileBadges).toEqual({
            'src/Test1.java': [new FileBadge(FileBadgeType.FEEDBACK_SUGGESTION, 1)],
            'src/Test2.java': [new FileBadge(FileBadgeType.FEEDBACK_SUGGESTION, 2)],
            'src/Test3.java': [new FileBadge(FileBadgeType.FEEDBACK_SUGGESTION, 3)],
        });
    });
});
