import { Component, OnInit, inject } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { LtiInitializerModalComponent } from 'app/course/overview/exercise-details/lti-initializer-modal.component';
import { UserService } from 'app/core/user/shared/user.service';
import { AlertService } from 'app/shared/service/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from 'app/core/auth/account.service';

@Component({
    selector: 'jhi-lti-initializer',
    template: '',
})
export class LtiInitializerComponent implements OnInit {
    private modalService = inject(NgbModal);
    private userService = inject(UserService);
    private alertService = inject(AlertService);
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private accountService = inject(AccountService);

    modalRef: NgbModalRef | undefined;

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((queryParams) => {
            if (queryParams['initialize'] !== undefined) {
                this.userService.initializeLTIUser().subscribe((res) => {
                    const password = res.body?.password;
                    if (!password) {
                        this.alertService.info('artemisApp.lti.initializationError');
                        this.router.navigate([], {
                            relativeTo: this.activatedRoute,
                            queryParams: { initialize: null },
                            queryParamsHandling: 'merge',
                        });
                        return;
                    }
                    this.modalRef = this.modalService.open(LtiInitializerModalComponent, { size: 'lg', backdrop: 'static', keyboard: false });
                    this.modalRef.componentInstance.loginName = this.accountService.userIdentity?.login;
                    this.modalRef.componentInstance.password = password;
                });
            }
        });
    }
}
