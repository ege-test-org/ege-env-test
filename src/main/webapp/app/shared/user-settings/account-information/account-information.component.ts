import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { User } from 'app/core/user/user.model';
import { AccountService } from 'app/core/auth/account.service';
import { Observable } from 'rxjs';
import { CachingStrategy } from 'app/shared/image/secured-image.component';
import { faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ImageCropperModalComponent } from 'app/course/manage/image-cropper-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { base64StringToBlob } from 'app/utils/blob-util';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { UserSettingsService } from 'app/shared/user-settings/user-settings.service';
import { AlertService, AlertType } from 'app/shared/service/alert.service';
import { TranslateDirective } from '../../language/translate.directive';
import { SecuredImageComponent } from '../../image/secured-image.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ArtemisDatePipe } from 'app/shared/pipes/artemis-date.pipe';
import { addPublicFilePrefix } from 'app/app.constants';

@Component({
    selector: 'jhi-account-information',
    templateUrl: './account-information.component.html',
    styleUrls: ['../user-settings.scss'],
    imports: [TranslateDirective, SecuredImageComponent, FaIconComponent, ArtemisDatePipe],
})
export class AccountInformationComponent implements OnInit {
    private accountService = inject(AccountService);
    private modalService = inject(NgbModal);
    private userSettingsService = inject(UserSettingsService);
    private alertService = inject(AlertService);

    currentUser?: User;
    croppedImage?: string;

    @ViewChild('fileInput', { static: false }) fileInput: ElementRef<HTMLInputElement>;

    // Icons
    faPen = faPencil;
    faTrash = faTrash;
    faPlus = faPlus;

    ngOnInit() {
        this.accountService.getAuthenticationState().subscribe((user) => {
            this.currentUser = user;
        });
    }

    setUserImage(event: Event) {
        const element = event.currentTarget as HTMLInputElement;
        if (element.files && element.files.length > 0) {
            const modalRef = this.modalService.open(ImageCropperModalComponent, { size: 'm' });
            modalRef.componentInstance.roundCropper = false;
            modalRef.componentInstance.fileFormat = 'jpeg';
            modalRef.componentInstance.uploadFile = element.files[0];
            const mimeType = element.files[0].type;
            modalRef.result.then((result: any) => {
                if (result) {
                    const base64Data = result.replace('data:image/jpeg;base64,', '');
                    const fileToUpload = base64StringToBlob(base64Data, mimeType);
                    this.subscribeToUpdateProfilePictureResponse(this.userSettingsService.updateProfilePicture(fileToUpload));
                }
            });
        }
        element.value = '';
    }

    deleteUserImage() {
        this.subscribeToRemoveProfilePictureResponse(this.userSettingsService.removeProfilePicture());
    }

    triggerUserImageFileInput() {
        this.fileInput.nativeElement.click();
    }

    private subscribeToUpdateProfilePictureResponse(result: Observable<HttpResponse<User>>) {
        result.subscribe({
            next: (response: HttpResponse<User>) => this.onProfilePictureUploadSuccess(response.body),
            error: (res: HttpErrorResponse) => this.onProfilePictureUploadError(res),
        });
    }

    private subscribeToRemoveProfilePictureResponse(result: Observable<HttpResponse<User>>) {
        result.subscribe({
            next: () => this.onProfilePictureRemoveSuccess(),
            error: (res: HttpErrorResponse) => this.onProfilePictureRemoveError(res),
        });
    }

    private onProfilePictureUploadSuccess(user: User | null) {
        if (user !== null && user.imageUrl !== undefined) {
            this.currentUser!.imageUrl = user.imageUrl;
            this.accountService.setImageUrl(user.imageUrl);
        }
    }

    private onProfilePictureUploadError(error: HttpErrorResponse) {
        const errorMessage = error.error ? error.error.title : error.headers?.get('x-artemisapp-alert');
        if (errorMessage) {
            this.alertService.addAlert({
                type: AlertType.DANGER,
                message: errorMessage,
                disableTranslation: true,
            });
        }
    }

    private onProfilePictureRemoveSuccess() {
        this.currentUser!.imageUrl = undefined;
        this.accountService.setImageUrl(undefined);
    }

    private onProfilePictureRemoveError(error: HttpErrorResponse) {
        const errorMessage = error.error ? error.error.title : error.headers?.get('x-artemisapp-alert');
        if (errorMessage) {
            this.alertService.addAlert({
                type: AlertType.DANGER,
                message: errorMessage,
                disableTranslation: true,
            });
        }
    }

    protected readonly CachingStrategy = CachingStrategy;
    protected readonly addPublicFilePrefix = addPublicFilePrefix;
}
