import { Directive, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { captureException } from '@sentry/angular';

@Directive()
export abstract class AbstractDialogComponent {
    activeModal = inject(NgbActiveModal);
    isInitialized = false;

    initialize(requiredInputs?: string[]) {
        const allInputsSet = (requiredInputs ?? []).every((input) => this[input as keyof this] !== undefined);
        if (!allInputsSet) {
            captureException('Error: Dialog not fully configured');
        } else {
            this.isInitialized = true;
        }
    }

    dismiss() {
        if (this.activeModal) {
            this.activeModal.dismiss();
        }
    }
    close(result?: any) {
        if (this.activeModal) {
            this.activeModal.close(result);
        }
    }
}
