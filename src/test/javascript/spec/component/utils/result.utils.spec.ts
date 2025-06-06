import {
    ResultTemplateStatus,
    breakCircularResultBackReferences,
    getManualUnreferencedFeedback,
    getResultIconClass,
    getTextColorClass,
    getUnreferencedFeedback,
    isOnlyCompilationTested,
} from 'app/exercise/result/result.utils';
import { Feedback, FeedbackType, STATIC_CODE_ANALYSIS_FEEDBACK_IDENTIFIER } from 'app/entities/feedback.model';
import { Submission, SubmissionExerciseType } from 'app/entities/submission.model';
import { AssessmentType } from 'app/entities/assessment-type.model';
import { Participation, ParticipationType } from 'app/entities/participation/participation.model';
import { MIN_SCORE_GREEN, MIN_SCORE_ORANGE } from 'app/app.constants';
import { faCheckCircle, faQuestionCircle, faTimesCircle } from '@fortawesome/free-regular-svg-icons';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { ExerciseType } from 'app/entities/exercise.model';
import { Result } from 'app/entities/result.model';
import dayjs from 'dayjs/esm';

describe('ResultUtils', () => {
    it('should filter out all non unreferenced feedbacks that do not have type MANUAL_UNREFERENCED', () => {
        const feedbacks = [
            { reference: 'foo' },
            { reference: 'foo', type: FeedbackType.MANUAL_UNREFERENCED },
            { type: FeedbackType.AUTOMATIC },
            { type: FeedbackType.MANUAL_UNREFERENCED },
            {},
        ];
        const unreferencedFeedbacks = getManualUnreferencedFeedback(feedbacks);
        expect(unreferencedFeedbacks).toEqual([{ type: FeedbackType.MANUAL_UNREFERENCED }]);
    });

    it('should filter out all non unreferenced feedbacks', () => {
        const feedbacks = [
            { reference: 'foo' },
            { reference: 'foo', type: FeedbackType.AUTOMATIC },
            { type: FeedbackType.AUTOMATIC },
            { type: FeedbackType.MANUAL_UNREFERENCED },
            { reference: 'foo', type: FeedbackType.AUTOMATIC_ADAPTED },
            {},
        ];
        const unreferencedFeedbacks = getUnreferencedFeedback(feedbacks);
        expect(unreferencedFeedbacks).toEqual([{ type: FeedbackType.AUTOMATIC }, { type: FeedbackType.MANUAL_UNREFERENCED }]);
    });

    it.each([
        {
            result: {
                participation: { exercise: { type: ExerciseType.PROGRAMMING } },
                feedbacks: [{ type: FeedbackType.AUTOMATIC, text: STATIC_CODE_ANALYSIS_FEEDBACK_IDENTIFIER }, { type: FeedbackType.MANUAL }],
                testCaseCount: 0,
            } as Result,
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: true,
        },
        {
            result: { feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'This is a test case' }, { type: FeedbackType.MANUAL }], testCaseCount: 1 },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: false,
        },
        {
            result: { feedbacks: [{ type: FeedbackType.AUTOMATIC, text: STATIC_CODE_ANALYSIS_FEEDBACK_IDENTIFIER }, { type: FeedbackType.MANUAL }], testCaseCount: 0 },
            templateStatus: ResultTemplateStatus.NO_RESULT,
            expected: false,
        },
        {
            result: { feedbacks: [{ type: FeedbackType.AUTOMATIC, text: STATIC_CODE_ANALYSIS_FEEDBACK_IDENTIFIER }, { type: FeedbackType.MANUAL }], testCaseCount: 0 },
            templateStatus: ResultTemplateStatus.IS_BUILDING,
            expected: false,
        },
    ])('should correctly determine if compilation is tested', ({ result, templateStatus, expected }) => {
        expect(isOnlyCompilationTested(result, templateStatus!)).toBe(expected);
    });

    it.each([
        { result: undefined, templateStatus: ResultTemplateStatus.HAS_RESULT, expected: 'text-secondary' },
        { result: {}, templateStatus: ResultTemplateStatus.LATE, expected: 'result-late' },
        {
            result: { submission: { submissionExerciseType: SubmissionExerciseType.PROGRAMMING, buildFailed: true }, assessmentType: AssessmentType.AUTOMATIC },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: 'text-danger',
        },
        {
            result: { participation: { type: ParticipationType.PROGRAMMING, exercise: { type: ExerciseType.PROGRAMMING } } as Result, assessmentType: AssessmentType.AUTOMATIC },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: 'text-secondary',
        },
        { result: { score: undefined, successful: true }, templateStatus: ResultTemplateStatus.HAS_RESULT, expected: 'text-success' },
        {
            result: { score: 0, successful: undefined, assessmentType: AssessmentType.AUTOMATIC_ATHENA },
            templateStatus: ResultTemplateStatus.IS_GENERATING_FEEDBACK,
            expected: 'text-secondary',
        },
        {
            result: { score: 0, successful: true, assessmentType: AssessmentType.AUTOMATIC_ATHENA },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: 'text-secondary',
        },
        { result: { score: undefined, successful: false }, templateStatus: ResultTemplateStatus.HAS_RESULT, expected: 'text-danger' },
        { result: { score: MIN_SCORE_GREEN, testCaseCount: 1 }, templateStatus: ResultTemplateStatus.HAS_RESULT, expected: 'text-success' },
        { result: { score: MIN_SCORE_ORANGE, testCaseCount: 1 }, templateStatus: ResultTemplateStatus.HAS_RESULT, expected: 'result-orange' },
        { result: {}, templateStatus: ResultTemplateStatus.HAS_RESULT, expected: 'text-danger' },
        {
            result: { score: 1, participation: { exercise: { type: ExerciseType.PROGRAMMING } } } as Result,
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: 'text-success',
        },
    ])('should correctly determine text color class', ({ result, templateStatus, expected }) => {
        expect(getTextColorClass(result, templateStatus!)).toBe(expected);
    });

    it.each([
        { result: { participation: { exercise: { type: ExerciseType.PROGRAMMING } } } as Result, templateStatus: ResultTemplateStatus.HAS_RESULT, expected: faCheckCircle },
        { result: undefined, templateStatus: ResultTemplateStatus.HAS_RESULT, expected: faQuestionCircle },
        {
            result: { submission: { submissionExerciseType: SubmissionExerciseType.PROGRAMMING, buildFailed: true }, assessmentType: AssessmentType.AUTOMATIC },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faTimesCircle,
        },
        {
            result: { participation: { type: ParticipationType.PROGRAMMING, exercise: { type: ExerciseType.PROGRAMMING } } } as Result,
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faQuestionCircle,
        },
        {
            result: { score: undefined, successful: true, feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'This is a test case' }], testCaseCount: 1 },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faCheckCircle,
        },
        {
            result: { score: undefined, successful: false, feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'This is a test case' }], testCaseCount: 1 },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faTimesCircle,
        },
        {
            result: { score: MIN_SCORE_GREEN, feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'This is a test case' }], testCaseCount: 1 },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faCheckCircle,
        },
        {
            result: { score: MIN_SCORE_ORANGE, feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'This is a test case' }], testCaseCount: 1 },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faTimesCircle,
        },
        {
            result: { feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'This is a test case' }], testCaseCount: 1 },
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faTimesCircle,
        },
        {
            result: {
                feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'AI result being generated test case' }],
                assessmentType: AssessmentType.AUTOMATIC_ATHENA,
                successful: undefined,
                completionDate: dayjs().add(5, 'minutes'),
            },
            templateStatus: ResultTemplateStatus.IS_GENERATING_FEEDBACK,
            expected: faCircleNotch,
        },
        {
            result: {
                feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'AI result >= 100' }],
                participation: { type: ParticipationType.STUDENT, exercise: { type: ExerciseType.TEXT } },
                successful: true,
                assessmentType: AssessmentType.AUTOMATIC_ATHENA,
                completionDate: dayjs().subtract(5, 'minutes'),
            } as Result,
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faCheckCircle,
        },
        {
            result: {
                feedbacks: [{ type: FeedbackType.AUTOMATIC, text: 'AI result failed to generate' }],
                participation: { type: ParticipationType.STUDENT, exercise: { type: ExerciseType.TEXT } },
                successful: false,
                assessmentType: AssessmentType.AUTOMATIC_ATHENA,
                completionDate: dayjs().subtract(5, 'minutes'),
            } as Result,
            templateStatus: ResultTemplateStatus.HAS_RESULT,
            expected: faTimesCircle,
        },
    ])('should correctly determine result icon', ({ result, templateStatus, expected }) => {
        expect(getResultIconClass(result, templateStatus!)).toBe(expected);
    });

    describe('circular reference breaker', () => {
        const baseParticipation = {} as Participation;
        const baseSubmission = {
            participation: baseParticipation,
        } as Submission;
        const baseResult = {
            submission: baseSubmission,
            participation: baseParticipation,
        } as Result;

        it('should break a reference from the participation results back to the result', () => {
            baseParticipation.results = [baseResult];
            breakCircularResultBackReferences(baseResult);
            expect(baseParticipation.results).toEqual([]);
        });

        it('should break a reference from the submission results back to the result', () => {
            baseSubmission.results = [baseResult];
            breakCircularResultBackReferences(baseResult);
            expect(baseSubmission.results).toEqual([]);
        });

        it('should break a reference chain result -> submission -> participation -> result', () => {
            // do not use baseParticipation here, otherwise the direct reference result -> participation is identical
            baseResult.submission!.participation = {
                results: [baseResult],
            } as Participation;

            breakCircularResultBackReferences(baseResult);

            expect(baseSubmission.results).toEqual([]);
        });

        it('should break a reference from feedbacks back to the result', () => {
            const feedback = {
                result: baseResult,
            } as Feedback;
            baseResult.feedbacks = [feedback];

            breakCircularResultBackReferences(baseResult);

            expect(baseResult.feedbacks[0].result).toBeUndefined();
        });
    });
});
