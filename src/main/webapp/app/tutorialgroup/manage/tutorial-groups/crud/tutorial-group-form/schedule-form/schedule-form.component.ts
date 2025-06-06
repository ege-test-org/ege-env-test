import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbDateParserFormatter, NgbTimeAdapter, NgbTimepicker } from '@ng-bootstrap/ng-bootstrap';
import { Course } from 'app/entities/course.model';
import * as _ from 'lodash-es';
import dayjs from 'dayjs/esm';
import { dayOfWeekZeroSundayToZeroMonday } from 'app/utils/date.utils';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { OwlDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ArtemisDatePipe } from 'app/shared/pipes/artemis-date.pipe';
import { ArtemisDateRangePipe } from 'app/shared/pipes/artemis-date-range.pipe';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { NgbTimeStringAdapter } from 'app/tutorialgroup/shared/ngbTimeStringAdapter';
import { weekDays } from 'app/tutorialgroup/shared/weekdays';
import { validTimeRange } from 'app/tutorialgroup/shared/timeRangeValidator';

export interface ScheduleFormData {
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    repetitionFrequency?: number;
    period?: Date[];
    location?: string;
}

@Component({
    selector: 'jhi-schedule-form',
    templateUrl: './schedule-form.component.html',
    styleUrls: ['./schedule-form.component.scss'],
    providers: [{ provide: NgbTimeAdapter, useClass: NgbTimeStringAdapter }, ArtemisDatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, TranslateDirective, NgbTimepicker, OwlDateTimeModule, FaIconComponent, ArtemisDatePipe, ArtemisDateRangePipe, ArtemisTranslatePipe],
})
export class ScheduleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    formatter = inject(NgbDateParserFormatter);
    cdr = inject(ChangeDetectorRef);

    course = input.required<Course>();
    parentFormGroup = input.required<FormGroup>();
    formGroup: FormGroup;

    defaultPeriod?: Date[] = undefined;

    weekDays = weekDays;
    faCalendarAlt = faCalendarAlt;

    get defaultPeriodChanged(): boolean {
        return !_.isEqual(this.defaultPeriod, this.formGroup.get('period')!.value);
    }

    get parentIsOnlineControl() {
        return this.parentFormGroup().get('isOnline');
    }

    get periodControl() {
        return this.formGroup.get('period');
    }

    get startTimeControl() {
        return this.formGroup.get('startTime');
    }

    get endTimeControl() {
        return this.formGroup.get('endTime');
    }

    get locationControl() {
        return this.formGroup.get('location');
    }

    get repetitionFrequencyControl() {
        return this.formGroup.get('repetitionFrequency');
    }

    get createdSessions() {
        const sessions: dayjs.Dayjs[] = [];

        if (this.formGroup.valid) {
            const { dayOfWeek, repetitionFrequency, period } = this.formGroup.value;
            let start = dayjs(period[0]);
            const end = dayjs(period[1]);

            // find the first day of the week
            while (dayOfWeekZeroSundayToZeroMonday(start.day()) + 1 !== dayOfWeek) {
                start = start.add(1, 'day');
            }

            // add sessions
            while (start.isBefore(end) || start.isSame(end)) {
                sessions.push(start);
                start = start.add(repetitionFrequency, 'week');
            }
        }

        return sessions;
    }

    ngOnInit(): void {
        const tutorialGroupsConfiguration = this.course().tutorialGroupsConfiguration;
        if (tutorialGroupsConfiguration) {
            const { tutorialPeriodStartInclusive, tutorialPeriodEndInclusive } = tutorialGroupsConfiguration;
            this.defaultPeriod = [tutorialPeriodStartInclusive!.toDate(), tutorialPeriodEndInclusive!.toDate()];
        }

        this.formGroup = this.fb.group(
            {
                dayOfWeek: [1, Validators.required],
                startTime: ['13:00:00', [Validators.required]],
                endTime: ['14:00:00', [Validators.required]],
                repetitionFrequency: [1, [Validators.required, Validators.min(1), Validators.max(7)]],
                period: [this.defaultPeriod, [Validators.required]],
                location: ['Zoom', [Validators.required]],
            },
            { validators: validTimeRange },
        );

        this.parentFormGroup().addControl('schedule', this.formGroup);

        this.parentIsOnlineControl?.valueChanges.subscribe(() => {
            this.cdr.detectChanges();
        });
    }

    get isPeriodInvalid() {
        if (this.periodControl) {
            return this.periodControl.invalid && (this.periodControl.touched || this.periodControl.dirty);
        } else {
            return false;
        }
    }

    markPeriodAsTouched() {
        if (this.periodControl) {
            this.periodControl.markAsTouched();
        }
    }
}
