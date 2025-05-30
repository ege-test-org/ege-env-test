import dayjs from 'dayjs/esm';
import { VideoUnitFormComponent, VideoUnitFormData } from 'app/lecture/manage/lecture-units/video-unit-form/video-unit-form.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { MockComponent, MockModule, MockPipe } from 'ng-mocks';
import { FormDateTimePickerComponent } from 'app/shared/date-time-picker/date-time-picker.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CompetencySelectionComponent } from 'app/shared/competency-selection/competency-selection.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MockTranslateService } from '../../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';

describe('VideoUnitFormComponent', () => {
    const validYouTubeUrl = 'https://www.youtube.com/watch?v=8iU8LPEa4o0';
    const validYouTubeUrlInEmbeddableFormat = 'https://www.youtube.com/embed/8iU8LPEa4o0';
    let videoUnitFormComponentFixture: ComponentFixture<VideoUnitFormComponent>;
    let videoUnitFormComponent: VideoUnitFormComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, FormsModule, MockModule(NgbTooltipModule), MockModule(OwlDateTimeModule), MockModule(OwlNativeDateTimeModule)],
            declarations: [
                VideoUnitFormComponent,
                FormDateTimePickerComponent,
                MockPipe(ArtemisTranslatePipe),
                MockComponent(FaIconComponent),
                MockComponent(CompetencySelectionComponent),
            ],
            providers: [{ provide: TranslateService, useClass: MockTranslateService }],
            schemas: [],
        })
            .compileComponents()
            .then(() => {
                videoUnitFormComponentFixture = TestBed.createComponent(VideoUnitFormComponent);
                videoUnitFormComponent = videoUnitFormComponentFixture.componentInstance;
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize', () => {
        videoUnitFormComponentFixture.detectChanges();
        expect(videoUnitFormComponent).not.toBeNull();
    });

    it('should not submit a form when name is missing', () => {
        jest.spyOn(videoUnitFormComponent, 'videoSourceUrlValidator').mockReturnValue(undefined);
        jest.spyOn(videoUnitFormComponent, 'videoSourceTransformUrlValidator').mockReturnValue(undefined);
        videoUnitFormComponentFixture.detectChanges();
        const exampleDescription = 'lorem ipsum';
        videoUnitFormComponent.descriptionControl!.setValue(exampleDescription);
        const exampleReleaseDate = dayjs().year(2010).month(3).date(5);
        videoUnitFormComponent.releaseDateControl!.setValue(exampleReleaseDate);
        videoUnitFormComponent.sourceControl!.setValue(validYouTubeUrlInEmbeddableFormat);
        videoUnitFormComponentFixture.detectChanges();
        expect(videoUnitFormComponent.form.invalid).toBeTrue();

        const submitFormSpy = jest.spyOn(videoUnitFormComponent, 'submitForm');
        const submitFormEventSpy = jest.spyOn(videoUnitFormComponent.formSubmitted, 'emit');

        const submitButton = videoUnitFormComponentFixture.debugElement.nativeElement.querySelector('#submitButton');
        submitButton.click();

        return videoUnitFormComponentFixture.whenStable().then(() => {
            expect(submitFormSpy).not.toHaveBeenCalled();
            expect(submitFormEventSpy).not.toHaveBeenCalled();
        });
    });

    it('should not submit a form when source is missing', () => {
        jest.spyOn(videoUnitFormComponent, 'videoSourceUrlValidator').mockReturnValue(undefined);
        jest.spyOn(videoUnitFormComponent, 'videoSourceTransformUrlValidator').mockReturnValue(undefined);
        videoUnitFormComponentFixture.detectChanges();
        const exampleName = 'test';
        videoUnitFormComponent.nameControl!.setValue(exampleName);
        const exampleDescription = 'lorem ipsum';
        videoUnitFormComponent.descriptionControl!.setValue(exampleDescription);
        const exampleReleaseDate = dayjs().year(2010).month(3).date(5);
        videoUnitFormComponent.releaseDateControl!.setValue(exampleReleaseDate);
        videoUnitFormComponentFixture.detectChanges();
        expect(videoUnitFormComponent.form.invalid).toBeTrue();

        const submitFormSpy = jest.spyOn(videoUnitFormComponent, 'submitForm');
        const submitFormEventSpy = jest.spyOn(videoUnitFormComponent.formSubmitted, 'emit');

        const submitButton = videoUnitFormComponentFixture.debugElement.nativeElement.querySelector('#submitButton');
        submitButton.click();

        return videoUnitFormComponentFixture.whenStable().then(() => {
            expect(submitFormSpy).not.toHaveBeenCalled();
            expect(submitFormEventSpy).not.toHaveBeenCalled();
        });
    });

    it('should submit valid form', () => {
        jest.spyOn(videoUnitFormComponent, 'videoSourceUrlValidator').mockReturnValue(undefined);
        jest.spyOn(videoUnitFormComponent, 'videoSourceTransformUrlValidator').mockReturnValue(undefined);
        videoUnitFormComponentFixture.detectChanges();
        const exampleName = 'test';
        videoUnitFormComponent.nameControl!.setValue(exampleName);
        const exampleDescription = 'lorem ipsum';
        videoUnitFormComponent.descriptionControl!.setValue(exampleDescription);
        const exampleReleaseDate = dayjs().year(2010).month(3).date(5);
        videoUnitFormComponent.releaseDateControl!.setValue(exampleReleaseDate);
        videoUnitFormComponent.sourceControl!.setValue(validYouTubeUrlInEmbeddableFormat);
        videoUnitFormComponentFixture.detectChanges();
        expect(videoUnitFormComponent.form.valid).toBeTrue();

        const submitFormSpy = jest.spyOn(videoUnitFormComponent, 'submitForm');
        const submitFormEventSpy = jest.spyOn(videoUnitFormComponent.formSubmitted, 'emit');

        const submitButton = videoUnitFormComponentFixture.debugElement.nativeElement.querySelector('#submitButton');
        submitButton.click();

        return videoUnitFormComponentFixture.whenStable().then(() => {
            expect(submitFormSpy).toHaveBeenCalledOnce();
            expect(submitFormEventSpy).toHaveBeenCalledWith({
                name: exampleName,
                description: exampleDescription,
                releaseDate: exampleReleaseDate,
                competencyLinks: null,
                source: validYouTubeUrlInEmbeddableFormat,
                urlHelper: null,
            });

            submitFormSpy.mockRestore();
            submitFormEventSpy.mockRestore();
        });
    });

    it('should correctly transform YouTube URL into embeddable format', () => {
        jest.spyOn(videoUnitFormComponent, 'extractEmbeddedUrl').mockReturnValue(validYouTubeUrlInEmbeddableFormat);
        jest.spyOn(videoUnitFormComponent, 'videoSourceUrlValidator').mockReturnValue(undefined);
        jest.spyOn(videoUnitFormComponent, 'videoSourceTransformUrlValidator').mockReturnValue(undefined);

        videoUnitFormComponentFixture.detectChanges();

        videoUnitFormComponent.urlHelperControl!.setValue(validYouTubeUrl);
        videoUnitFormComponentFixture.detectChanges();
        const transformButton = videoUnitFormComponentFixture.debugElement.nativeElement.querySelector('#transformButton');
        transformButton.click();

        return videoUnitFormComponentFixture.whenStable().then(() => {
            expect(videoUnitFormComponent.sourceControl?.value).toEqual(validYouTubeUrlInEmbeddableFormat);
        });
    });

    it('should correctly transform TUM-Live URL without video only into embeddable format', () => {
        const tumLiveUrl = 'https://live.rbg.tum.de/w/test/26';
        const expectedUrl = 'https://live.rbg.tum.de/w/test/26?video_only=1';

        videoUnitFormComponentFixture.detectChanges();
        videoUnitFormComponent.urlHelperControl!.setValue(tumLiveUrl);
        videoUnitFormComponentFixture.detectChanges();

        const transformButton = videoUnitFormComponentFixture.debugElement.nativeElement.querySelector('#transformButton');
        transformButton.click();

        return videoUnitFormComponentFixture.whenStable().then(() => {
            expect(videoUnitFormComponent.sourceControl?.value).toEqual(expectedUrl);
        });
    });

    it('should correctly set form values in edit mode', () => {
        videoUnitFormComponentFixture.componentRef.setInput('isEditMode', true);
        const formData: VideoUnitFormData = {
            name: 'test',
            description: 'lorem ipsum',
            releaseDate: dayjs().year(2010).month(3).date(5),
            source: validYouTubeUrlInEmbeddableFormat,
        };
        videoUnitFormComponentFixture.detectChanges();

        videoUnitFormComponentFixture.componentRef.setInput('formData', formData);
        videoUnitFormComponentFixture.detectChanges();

        expect(videoUnitFormComponent.nameControl?.value).toEqual(formData.name);
        expect(videoUnitFormComponent.releaseDateControl?.value).toEqual(formData.releaseDate);
        expect(videoUnitFormComponent.descriptionControl?.value).toEqual(formData.description);
        expect(videoUnitFormComponent.sourceControl?.value).toEqual(formData.source);
    });

    it('should emit onCancel event when cancelForm is called', () => {
        const onCancelSpy = jest.spyOn(videoUnitFormComponent.onCancel, 'emit');
        videoUnitFormComponent.cancelForm();
        expect(onCancelSpy).toHaveBeenCalled();
    });
});
