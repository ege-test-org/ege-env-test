import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { User } from 'app/core/user/user.model';
import { AccountService } from 'app/core/auth/account.service';
import { Subject, Subscription, tap } from 'rxjs';
import dayjs from 'dayjs/esm';
import { faBan, faCopy, faEdit, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ButtonSize, ButtonType } from 'app/shared/components/button.component';
import { AlertService } from 'app/shared/service/alert.service';
import { TranslateDirective } from '../../language/translate.directive';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DeleteButtonDirective } from '../../delete-dialog/delete-button.directive';
import { ButtonComponent } from '../../components/button.component';
import { FormDateTimePickerComponent } from '../../date-time-picker/date-time-picker.component';
import { FormsModule } from '@angular/forms';
import { ArtemisDatePipe } from 'app/shared/pipes/artemis-date.pipe';
import { ArtemisTranslatePipe } from '../../pipes/artemis-translate.pipe';

@Component({
    selector: 'jhi-account-information',
    templateUrl: './vcs-access-tokens-settings.component.html',
    styleUrls: ['../user-settings.scss'],
    imports: [
        TranslateDirective,
        CdkCopyToClipboard,
        FaIconComponent,
        DeleteButtonDirective,
        ButtonComponent,
        FormDateTimePickerComponent,
        FormsModule,
        ArtemisDatePipe,
        ArtemisTranslatePipe,
    ],
})
export class VcsAccessTokensSettingsComponent implements OnInit, OnDestroy {
    private accountService = inject(AccountService);
    private alertService = inject(AlertService);

    currentUser?: User;

    readonly faEdit = faEdit;
    readonly faSave = faSave;
    readonly faTrash = faTrash;
    readonly faCopy = faCopy;
    readonly faBan = faBan;
    private authStateSubscription: Subscription;
    expiryDate?: dayjs.Dayjs;
    validExpiryDate = false;
    wasCopied = false;
    edit = false;

    private dialogErrorSource = new Subject<string>();

    dialogError$ = this.dialogErrorSource.asObservable();

    protected readonly ButtonType = ButtonType;
    protected readonly ButtonSize = ButtonSize;

    ngOnInit() {
        this.authStateSubscription = this.accountService
            .getAuthenticationState()
            .pipe(
                tap((user: User) => {
                    this.currentUser = user;
                    return this.currentUser;
                }),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.authStateSubscription.unsubscribe();
    }

    deleteVcsAccessToken() {
        this.accountService.deleteUserVcsAccessToken().subscribe({
            next: () => {
                if (this.currentUser) {
                    this.currentUser.vcsAccessTokenExpiryDate = undefined;
                    this.currentUser.vcsAccessToken = undefined;
                }
                this.alertService.success('artemisApp.userSettings.vcsAccessTokensSettingsPage.deleteSuccess');
            },
            error: () => {
                this.alertService.error('artemisApp.userSettings.vcsAccessTokensSettingsPage.deleteFailure');
            },
        });
        this.dialogErrorSource.next('');
    }

    addNewVcsAccessToken() {
        this.edit = true;
    }

    sendTokenCreationRequest() {
        if (!this.expiryDate || this.expiryDate.isBefore(dayjs()) || this.expiryDate.isAfter(dayjs().add(1, 'year'))) {
            this.alertService.error('artemisApp.userSettings.vcsAccessTokensSettingsPage.addFailure');
            return;
        }
        this.accountService.addNewVcsAccessToken(this.expiryDate.toISOString()).subscribe({
            next: (res) => {
                if (this.currentUser) {
                    const user = res.body as User;
                    this.currentUser.vcsAccessToken = user.vcsAccessToken;
                    this.currentUser.vcsAccessTokenExpiryDate = user.vcsAccessTokenExpiryDate;
                    this.edit = false;
                }
                this.alertService.success('artemisApp.userSettings.vcsAccessTokensSettingsPage.addSuccess');
            },
            error: () => {
                this.alertService.error('artemisApp.userSettings.vcsAccessTokensSettingsPage.addFailure');
            },
        });
    }

    /**
     * set wasCopied for 3 seconds on success
     */
    onCopyFinished(successful: boolean) {
        if (successful) {
            this.wasCopied = true;
            setTimeout(() => {
                this.wasCopied = false;
            }, 3000);
        }
    }

    /**
     * Validates if the expiry date is after current time
     */
    validateDate() {
        this.validExpiryDate = !!this.expiryDate?.isAfter(dayjs()) && !!this.expiryDate?.isBefore(dayjs().add(1, 'year'));
    }

    /**
     *  Cancel creation of a new token
     */
    cancelTokenCreation() {
        this.edit = false;
        this.expiryDate = undefined;
        this.validExpiryDate = false;
    }
}
