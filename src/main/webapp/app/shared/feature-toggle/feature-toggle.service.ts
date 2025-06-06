import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebsocketService } from 'app/shared/service/websocket.service';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

/**
 * FeatureToggles
 * @readonly
 * @enum {string}
 */
export enum FeatureToggle {
    ProgrammingExercises = 'ProgrammingExercises',
    PlagiarismChecks = 'PlagiarismChecks',
    Exports = 'Exports',
    TutorialGroups = 'TutorialGroups',
    LearningPaths = 'LearningPaths',
    Science = 'Science',
    StandardizedCompetencies = 'StandardizedCompetencies',
    StudentCourseAnalyticsDashboard = 'StudentCourseAnalyticsDashboard',
    CourseSpecificNotifications = 'CourseSpecificNotifications',
}
export type ActiveFeatureToggles = Array<FeatureToggle>;

const defaultActiveFeatureState: ActiveFeatureToggles = Object.values(FeatureToggle);

@Injectable({ providedIn: 'root' })
export class FeatureToggleService {
    private websocketService = inject(WebsocketService);
    private http = inject(HttpClient);

    private readonly TOPIC = `/topic/management/feature-toggles`;
    private subject: BehaviorSubject<ActiveFeatureToggles>;
    private subscriptionInitialized = false;

    constructor() {
        this.subject = new BehaviorSubject<ActiveFeatureToggles>(defaultActiveFeatureState);
    }

    /**
     * This method is only supposed to be called by the account service once the user is logged in!
     */
    public subscribeFeatureToggleUpdates() {
        if (!this.subscriptionInitialized) {
            this.websocketService.subscribe(this.TOPIC);
            this.websocketService
                .receive(this.TOPIC)
                .pipe(tap((activeFeatures) => this.notifySubscribers(activeFeatures)))
                .subscribe();
            this.subscriptionInitialized = true;
        }
    }

    /**
     * This method is only supposed to be called by the account service once the user is logged out!
     */
    public unsubscribeFeatureToggleUpdates() {
        if (this.subscriptionInitialized) {
            this.websocketService.unsubscribe(this.TOPIC);
            this.subscriptionInitialized = false;
        }
    }

    private notifySubscribers(activeFeatures: ActiveFeatureToggles) {
        this.subject.next(activeFeatures);
    }

    /**
     * Set the initial value of the feature toggles. Use with care as the set value will be sent to all subscribers!
     * The feature toggle value updates are transmitted from the server to the client with a websocket,
     * so there should be no reason to set the values manually, other than on initialization.
     * @param activeFeatures
     */
    initializeFeatureToggles(activeFeatures: ActiveFeatureToggles) {
        this.notifySubscribers(activeFeatures);
    }

    /**
     * Getter method for the feature toggles as an observable.
     */
    getFeatureToggles() {
        return this.subject.asObservable().pipe(distinctUntilChanged());
    }

    /**
     * Getter method for the active features toggles as an observable.
     * Will check that the passed feature is enabled
     */
    getFeatureToggleActive(feature: FeatureToggle) {
        return this.getFeatureTogglesActive([feature]);
    }

    /**
     * Getter method for the active features toggles as an observable.
     * Will check that all passed features are enabled
     */
    getFeatureTogglesActive(features: FeatureToggle[]) {
        return this.subject.asObservable().pipe(
            map((activeFeatures) => features.every((feature) => activeFeatures.includes(feature))),
            distinctUntilChanged(),
        );
    }

    /**
     * Setter method for the state of a feature toggle.
     */
    setFeatureToggleState(featureToggle: FeatureToggle, active: boolean) {
        const url = '/api/core/admin/feature-toggle';
        const toggleParam = { [featureToggle]: active };
        return this.http.put(url, toggleParam);
    }
}
