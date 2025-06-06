import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import dayjs from 'dayjs/esm';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Lecture } from 'app/entities/lecture.model';
import { Attachment, AttachmentType } from 'app/entities/attachment.model';
import { LectureAttachmentsComponent } from 'app/lecture/manage/lecture-attachments.component';
import { AttachmentService } from 'app/lecture/manage/attachment.service';
import { FileService } from 'app/shared/http/file.service';
import { HtmlForMarkdownPipe } from 'app/shared/pipes/html-for-markdown.pipe';
import { MockDirective, MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { MockFileService } from '../../helpers/mocks/service/mock-file.service';
import { ArtemisDatePipe } from 'app/shared/pipes/artemis-date.pipe';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { FormDateTimePickerComponent } from 'app/shared/date-time-picker/date-time-picker.component';
import { DeleteButtonDirective } from 'app/shared/delete-dialog/delete-button.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, take, throwError } from 'rxjs';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { LectureService } from 'app/lecture/manage/lecture.service';
import { RouterModule } from '@angular/router';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { SessionStorageService } from 'ngx-webstorage';

describe('LectureAttachmentsComponent', () => {
    let comp: LectureAttachmentsComponent;
    let fixture: ComponentFixture<LectureAttachmentsComponent>;
    let lectureService: LectureService;
    let attachmentService: AttachmentService;
    let attachmentServiceFindAllByLectureIdStub: jest.SpyInstance;
    let attachmentServiceCreateStub: jest.SpyInstance;
    let attachmentServiceUpdateStub: jest.SpyInstance;

    const lecture = {
        id: 4,
        title: 'Second Test Lecture2',
        description:
            'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        startDate: dayjs('2019-04-15T14:00:19+02:00'),
        endDate: dayjs('2019-04-15T15:30:20+02:00'),
        course: {
            id: 1,
            title: 'Refactoring CSS',
            description:
                'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
            shortName: 'RCSS',
            studentGroupName: 'artemis-dev',
            teachingAssistantGroupName: 'tumuser',
            instructorGroupName: 'tumuser',
            startDate: dayjs('2018-12-15T16:11:00+01:00'),
            endDate: dayjs('2019-06-15T16:11:14+02:00'),
            onlineCourse: false,
            color: '#691b0b',
            enrollmentEnabled: false,
        },
    } as Lecture;

    const attachments = [
        {
            id: 50,
            name: 'test',
            link: '/api/core/files/attachments/lecture/4/Mein_Test_PDF4.pdf',
            version: 2,
            uploadDate: dayjs('2019-05-05T10:05:25+02:00'),
            attachmentType: 'FILE',
        },
        {
            id: 52,
            name: 'test2',
            link: '/api/core/files/attachments/lecture/4/Mein_Test_PDF3.pdf',
            version: 1,
            uploadDate: dayjs('2019-05-07T08:49:59+02:00'),
            attachmentType: 'FILE',
        },
    ] as Attachment[];

    const newAttachment = {
        id: 53,
        name: 'TestFile',
        link: '/api/core/files/attachments/lecture/4/Mein_Test_PDF3.pdf',
        version: 1,
        uploadDate: dayjs('2019-05-07T08:49:59+02:00'),
        attachmentType: 'FILE',
    } as Attachment;

    beforeEach(() => {
        return TestBed.configureTestingModule({
            imports: [MockDirective(NgbTooltip), RouterModule, ReactiveFormsModule, FormsModule, MockModule(OwlDateTimeModule), MockModule(OwlNativeDateTimeModule)],
            declarations: [
                LectureAttachmentsComponent,
                FormDateTimePickerComponent,
                MockDirective(DeleteButtonDirective),
                MockPipe(ArtemisTranslatePipe),
                MockPipe(HtmlForMarkdownPipe),
                MockPipe(ArtemisDatePipe),
            ],
            providers: [
                { provide: ActivatedRoute, useValue: { parent: { data: of({ lecture }) } } },
                { provide: FileService, useClass: MockFileService },
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                MockProvider(AttachmentService),
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(LectureAttachmentsComponent);
                comp = fixture.componentInstance;
                attachmentService = TestBed.inject(AttachmentService);
                lectureService = TestBed.inject(LectureService);
                attachmentServiceFindAllByLectureIdStub = jest.spyOn(attachmentService, 'findAllByLectureId').mockReturnValue(of(new HttpResponse({ body: [...attachments] })));
                attachmentServiceCreateStub = jest.spyOn(attachmentService, 'create').mockReturnValue(of(new HttpResponse({ body: newAttachment })));
                attachmentServiceUpdateStub = jest.spyOn(attachmentService, 'update').mockReturnValue(of(new HttpResponse({ body: newAttachment })));
            });
    });

    afterEach(() => {
        comp.attachments = [...attachments];
        jest.restoreAllMocks();
    });

    it('should load existing lecture', fakeAsync(() => {
        fixture.componentRef.setInput('lectureId', 42);
        const findWithDetailsStub = jest.spyOn(lectureService, 'findWithDetails').mockReturnValue(
            of(
                new HttpResponse({
                    body: {
                        ...lecture,
                        id: 42,
                    },
                }),
            ),
        );
        const findAllAttachmentsByLectureId = jest.spyOn(attachmentService, 'findAllByLectureId').mockReturnValue(of(new HttpResponse({ body: attachments })));
        fixture.detectChanges();
        expect(findWithDetailsStub).toHaveBeenCalledWith(42);
        expect(findAllAttachmentsByLectureId).toHaveBeenCalledWith(42);
    }));

    it('should accept file and add attachment to list', fakeAsync(() => {
        fixture.detectChanges();
        jest.spyOn(attachmentService, 'create').mockReturnValue(of(new HttpResponse({ body: newAttachment })));
        const addAttachmentButton = fixture.debugElement.query(By.css('#add-attachment'));
        expect(comp.attachmentToBeUpdatedOrCreated()).toBeUndefined();
        expect(addAttachmentButton).not.toBeNull();
        addAttachmentButton.nativeElement.click();
        fixture.detectChanges();
        comp.attachmentFile.set(new File([''], 'Test-File.pdf', { type: 'application/pdf' }));
        const uploadAttachmentButton = fixture.debugElement.query(By.css('#upload-attachment'));
        expect(uploadAttachmentButton).not.toBeNull();
        expect(comp.attachmentToBeUpdatedOrCreated()).not.toBeNull();
        comp.form.patchValue({
            attachmentName: 'Test File Name',
            releaseDate: dayjs(),
        });
        fixture.detectChanges();
        expect(uploadAttachmentButton.nativeElement.disabled).toBeFalse();
        uploadAttachmentButton.nativeElement.click();
        fixture.detectChanges();
        tick();
        expect(comp.attachments).toHaveLength(3);
        expect(attachmentServiceFindAllByLectureIdStub).toHaveBeenCalledTimes(2);
    }));

    it('should not accept too large file', fakeAsync(() => {
        attachmentServiceCreateStub.mockReturnValue(throwError(() => new Error('File too large')));
        fixture.detectChanges();
        const addAttachmentButton = fixture.debugElement.query(By.css('#add-attachment'));
        expect(comp.attachmentToBeUpdatedOrCreated()).toBeUndefined();
        expect(addAttachmentButton).not.toBeNull();
        addAttachmentButton.nativeElement.click();
        fixture.detectChanges();
        const fakeBlob = { name: 'Test-File.pdf', size: 100000000000000000 };
        comp.attachmentFile.set(fakeBlob as File);
        const uploadAttachmentButton = fixture.debugElement.query(By.css('#upload-attachment'));
        expect(uploadAttachmentButton).not.toBeNull();
        expect(comp.attachmentToBeUpdatedOrCreated()).not.toBeNull();
        comp.form.patchValue({
            attachmentName: 'Test File Name',
            releaseDate: dayjs(),
        });
        fixture.detectChanges();
        expect(uploadAttachmentButton.nativeElement.disabled).toBeFalse();
        uploadAttachmentButton.nativeElement.click();
        tick();
        fixture.detectChanges();
        const fileAlert = fixture.debugElement.query(By.css('#too-large-file-alert'));
        expect(comp.attachments).toHaveLength(2);
        expect(fileAlert).not.toBeNull();
        expect(attachmentServiceFindAllByLectureIdStub).toHaveBeenCalledOnce();
    }));

    it('should exit saveAttachment', fakeAsync(() => {
        fixture.detectChanges();
        comp.attachmentToBeUpdatedOrCreated.set(undefined);
        comp.saveAttachment();
        expect(attachmentServiceFindAllByLectureIdStub).toHaveBeenCalledOnce();
        expect(attachmentServiceCreateStub).not.toHaveBeenCalled();
        expect(attachmentServiceUpdateStub).not.toHaveBeenCalled();
        expect(comp.attachmentToBeUpdatedOrCreated()).toBeUndefined();
    }));

    it('should reset on error for create', fakeAsync(() => {
        const errorMessage = 'File too large';
        fixture.detectChanges();
        const attachment = {
            lecture: comp.lecture,
            attachmentType: AttachmentType.FILE,
            version: 1,
            uploadDate: dayjs(),
        } as Attachment;
        const file = new File([''], 'Test-File.pdf', { type: 'application/pdf' });
        comp.fileInput = { nativeElement: { value: 'Test-File.pdf' } };
        comp.attachmentToBeUpdatedOrCreated.set(attachment);
        comp.attachmentFile.set(file);
        const attachmentServiceCreateStub = jest.spyOn(attachmentService, 'create').mockReturnValue(throwError(() => new Error(errorMessage)));
        comp.saveAttachment();
        expect(attachmentServiceCreateStub).toHaveBeenCalledExactlyOnceWith(attachment, file);
        expect(comp.attachmentToBeUpdatedOrCreated()).toEqual(attachment);
        expect(comp.attachmentFile()).toBeUndefined();
        expect(comp.erroredFile).toEqual(file);
        expect(comp.errorMessage).toBe(errorMessage);
        expect(comp.fileInput.nativeElement.value).toBe('');
    }));

    it.each([true, false])(
        'should reset on error for update: %s',
        fakeAsync((withFile: boolean) => {
            const errorMessage = 'Some error message';
            const notification = 'Notification';
            const attachment = {
                id: 1,
                lecture: comp.lecture,
                attachmentType: AttachmentType.FILE,
                version: 1,
                uploadDate: dayjs(),
            } as Attachment;
            const backup = Object.assign({}, attachment);
            fixture.detectChanges();
            comp.fileInput = { nativeElement: { value: '' } };
            const file = new File([''], 'Test-File.pdf', { type: 'application/pdf' });
            if (withFile) {
                comp.fileInput.nativeElement.value = 'Test-File.pdf';
                comp.attachmentFile.set(file);
            }
            comp.attachmentToBeUpdatedOrCreated.set(attachment);
            comp.attachmentBackup = backup;
            comp.attachments = [attachment];

            // Do change
            comp.form.patchValue({
                attachmentName: 'New Name',
                notificationText: notification,
            });

            const attachmentServiceUpdateStub = jest.spyOn(attachmentService, 'update').mockReturnValue(throwError(() => new Error(errorMessage)));
            comp.saveAttachment();
            expect(attachmentServiceUpdateStub).toHaveBeenCalledExactlyOnceWith(1, attachment, withFile ? file : undefined, { notificationText: notification });
            expect(comp.attachmentToBeUpdatedOrCreated()).toEqual(attachment);
            expect(comp.errorMessage).toBe(errorMessage);
            expect(comp.fileInput.nativeElement.value).toBe('');
            expect(comp.attachments).toEqual([backup]);
            expect(comp.attachmentBackup).toBeUndefined();
            expect(comp.attachmentFile()).toBeUndefined();

            if (withFile) {
                expect(comp.erroredFile).toEqual(file);
            } else {
                expect(comp.erroredFile).toBeUndefined();
            }
        }),
    );

    it('should update Attachment', fakeAsync(() => {
        fixture.detectChanges();
        comp.attachmentToBeUpdatedOrCreated.set({
            id: 1,
            lecture: comp.lecture,
            attachmentType: AttachmentType.FILE,
            version: 1,
            uploadDate: dayjs(),
        } as Attachment);
        comp.notificationText = 'wow how did i get here';
        const attachmentServiceUpdateStub = jest.spyOn(attachmentService, 'update').mockReturnValue(
            of(
                new HttpResponse({
                    body: {
                        id: 52,
                        name: 'TestFile',
                        link: '/api/core/files/attachments/lecture/4/Mein_Test_PDF3.pdf',
                        version: 2,
                        uploadDate: dayjs('2019-05-07T08:49:59+02:00'),
                        attachmentType: 'FILE',
                    } as Attachment,
                }),
            ),
        );
        comp.saveAttachment();
        expect(attachmentServiceUpdateStub).toHaveBeenCalledOnce();
        expect(comp.attachments[1].version).toBe(2);
        expect(attachmentServiceFindAllByLectureIdStub).toHaveBeenCalledOnce();
    }));

    it('should edit attachment', fakeAsync(() => {
        fixture.detectChanges();
        comp.attachmentToBeUpdatedOrCreated.set(undefined);
        expect(comp.attachmentToBeUpdatedOrCreated()).toBeUndefined();
        comp.editAttachment(newAttachment);
        expect(comp.attachmentToBeUpdatedOrCreated()).toBe(newAttachment);
        expect(comp.attachmentBackup).toEqual(newAttachment);
        expect(attachmentServiceFindAllByLectureIdStub).toHaveBeenCalledOnce();
    }));

    it('should delete attachment', fakeAsync(() => {
        fixture.detectChanges();
        const attachmentId = 52;
        const toDelete = {
            id: attachmentId,
            name: 'test2',
            link: '/api/core/files/attachments/lecture/4/Mein_Test_PDF3.pdf',
            version: 1,
            uploadDate: dayjs('2019-05-07T08:49:59+02:00'),
            attachmentType: 'FILE',
        } as Attachment;
        comp.dialogError$.pipe(take(1)).subscribe((error) => expect(error).toBeEmpty());
        const attachmentServiceDeleteStub = jest.spyOn(attachmentService, 'delete').mockReturnValue(of(new HttpResponse({ body: null })));
        comp.deleteAttachment(toDelete);
        expect(comp.attachments).toHaveLength(1);
        expect(attachmentServiceDeleteStub).toHaveBeenCalledExactlyOnceWith(attachmentId);
        tick();
    }));

    it('should handle error on delete', fakeAsync(() => {
        fixture.detectChanges();
        const attachmentId = 52;
        const toDelete = {
            id: attachmentId,
            name: 'test2',
            link: '/api/core/files/attachments/lecture/4/Mein_Test_PDF3.pdf',
            version: 1,
            uploadDate: dayjs('2019-05-07T08:49:59+02:00'),
            attachmentType: 'FILE',
        } as Attachment;
        const errorMessage = 'Some error message';
        comp.dialogError$.pipe(take(1)).subscribe((error) => expect(error).toBe(errorMessage));
        const attachmentServiceDeleteStub = jest.spyOn(attachmentService, 'delete').mockReturnValue(throwError(() => new Error(errorMessage)));
        comp.deleteAttachment(toDelete);
        expect(comp.attachments).toHaveLength(2);
        expect(attachmentServiceDeleteStub).toHaveBeenCalledExactlyOnceWith(attachmentId);
        tick();
    }));

    it('should call cancel', fakeAsync(() => {
        fixture.detectChanges();
        const toCancel = {
            id: 52,
            name: 'test34',
            link: '/api/core/files/attachments/lecture/4/Mein_Test_PDF34.pdf',
            version: 5,
            uploadDate: dayjs('2019-05-07T08:49:59+02:00'),
            attachmentType: 'FILE',
        } as Attachment;
        comp.attachmentBackup = toCancel;
        comp.cancel();
        expect(comp.attachments[1]).toBe(toCancel);
        expect(attachmentServiceFindAllByLectureIdStub).toHaveBeenCalledOnce();
    }));

    it('should download attachment', fakeAsync(() => {
        fixture.detectChanges();
        comp.isDownloadingAttachmentLink = undefined;
        expect(comp.isDownloadingAttachmentLink).toBeUndefined();
        comp.downloadAttachment('https://my/own/download/url', 'test');
        expect(comp.isDownloadingAttachmentLink).toBeUndefined();
    }));

    it('should set lecture attachment', fakeAsync(() => {
        fixture.detectChanges();
        const myBlob1 = { size: 1024, name: '/api/core/files/attachments/lecture/4/NewTest34.pdf' };
        const myBlob2 = { size: 1024, name: '/api/core/files/attachments/lecture/4/NewTest100.pdf' };
        const object = {
            target: {
                files: [myBlob1, myBlob2],
            } as unknown as EventTarget,
        } as Event;
        comp.attachmentToBeUpdatedOrCreated.set(newAttachment);
        comp.setLectureAttachment(object);
        expect(comp.attachmentFile()).toBe(myBlob1);
        expect(comp.attachmentToBeUpdatedOrCreated()?.link).toBe(myBlob1.name);
        expect(attachmentServiceFindAllByLectureIdStub).toHaveBeenCalledOnce();
    }));

    describe('isViewButtonAvailable', () => {
        it('should return true if the attachment link ends with .pdf', () => {
            const attachment = { id: 1, link: 'example.pdf', attachmentType: 'FILE' } as Attachment;
            expect(comp.isViewButtonAvailable(attachment.link!)).toBeTrue();
        });

        it('should return false if the attachment link does not end with .pdf', () => {
            const attachment = { id: 2, link: 'example.txt', attachmentType: 'FILE' } as Attachment;
            expect(comp.isViewButtonAvailable(attachment.link!)).toBeFalse();
        });

        it.each([['document.docx'], ['spreadsheet.xlsx'], ['presentation.pptx'], ['image.jpeg']])('should return false for common file extension %s', (link) => {
            const attachment = { link };
            expect(comp.isViewButtonAvailable(attachment.link)).toBeFalse();
        });
    });
});
