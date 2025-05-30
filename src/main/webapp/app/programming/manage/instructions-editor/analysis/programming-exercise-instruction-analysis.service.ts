import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { RegExpLineNumberMatchArray, matchRegexWithLineNumbers } from 'app/shared/util/global.utils';
import { AnalysisItem, ProblemStatementAnalysis, ProblemStatementIssue } from 'app/programming/manage/instructions-editor/analysis/programming-exercise-instruction-analysis.model';

const TEST_CASE_REGEX = /\[[^[\]]+]\(((?:[^(),]+(?:\([^()]*\)[^(),]*)?(?:,[^(),]+(?:\([^()]*\)[^(),]*)?)*)?)\)/;
const INVALID_TEST_CASE_TRANSLATION = 'artemisApp.programmingExercise.testCaseAnalysis.invalidTestCase';
const REPEATED_TEST_CASE_TRANSLATION = 'artemisApp.programmingExercise.testCaseAnalysis.repeatedTestCase';

/**
 * Analyzes the problem statement of a programming-exercise and provides information support concerning potential issues.
 */
@Injectable({ providedIn: 'root' })
export class ProgrammingExerciseInstructionAnalysisService {
    private translateService = inject(TranslateService);

    /**
     * Given a programming exercise's problem statement, analyze the test cases contained (or not contained!) in it.
     * Will give out a mixed object that contains singular analysis for test cases and an accumulated analysis object.
     *
     * @param problemStatement  multiline string.
     * @param taskRegex         identifies tasks in a problem statement.
     * @param exerciseTestCases used to check if a test case is valid / missing.
     */
    public analyzeProblemStatement = (problemStatement: string, taskRegex: RegExp, exerciseTestCases: string[]) => {
        // Look for task regex matches in the problem statement including their line numbers.
        const tasksFromProblemStatement = matchRegexWithLineNumbers(problemStatement, taskRegex);

        const { invalidTestCases, missingTestCases, repeatedTestCases, invalidTestCaseAnalysis } = this.analyzeTestCases(tasksFromProblemStatement, exerciseTestCases);

        const completeAnalysis: ProblemStatementAnalysis = this.mergeAnalysis(invalidTestCaseAnalysis);
        return { invalidTestCases, missingTestCases, repeatedTestCases, completeAnalysis, numOfTasks: tasksFromProblemStatement.length };
    };

    /**
     * Analyze the test cases for the following criteria:
     * - Are test cases in the problem statement that don't exist for the exercise?
     * - Do test cases exist for this exercise that are not part of the problem statement?
     * - Are any test cases in the problem statement repeated?
     *
     * Will also set the invalidTestCases & missingTestCases & repeatedTestCases attributes of the component.
     *
     * @param tasksFromProblemStatement to analyze.
     * @param exerciseTestCases to double check the test cases found in the problem statement.
     */
    private analyzeTestCases = (tasksFromProblemStatement: RegExpLineNumberMatchArray, exerciseTestCases: string[]) => {
        // Extract the testCase list from the task matches.
        const testCasesInMarkdown = this.extractRegexFromTasks(tasksFromProblemStatement, TEST_CASE_REGEX);
        // Look for test cases that are not part of the test repository. Could, e.g., be typos.
        const invalidTestCaseAnalysis = testCasesInMarkdown
            .map(
                ([lineNumber, testCases]) =>
                    [
                        lineNumber,
                        uniq(testCases.filter((testCase) => !exerciseTestCases.map((exTestcase) => exTestcase.toLowerCase()).includes(testCase.toLowerCase()))),
                        ProblemStatementIssue.INVALID_TEST_CASES,
                    ] as AnalysisItem,
            )
            .filter(([, testCases]) => testCases.length);
        // Look for test cases that are part of the test repository but not in the problem statement. Probably forgotten to insert.
        const missingTestCases = exerciseTestCases.filter(
            (testCase) => !testCasesInMarkdown.some(([, foundTestCases]) => foundTestCases.map((foundTestCase) => foundTestCase.toLowerCase()).includes(testCase.toLowerCase())),
        );

        const invalidTestCases = invalidTestCaseAnalysis.flatMap(([, testCases]) => testCases);

        const testCaseOccurrences = testCasesInMarkdown.reduce((acc, [lineNumber, testCases]) => {
            testCases.forEach((testCase) => {
                acc.set(testCase, (acc.get(testCase) || []).concat(lineNumber));
            });
            return acc;
        }, new Map<string, number[]>());

        const repeatedTestCaseAnalysis = [...testCaseOccurrences.entries()]
            .filter(([, lineNumbers]) => lineNumbers.length > 1)
            .flatMap(([testCase, lineNumbers]) => uniq(lineNumbers).map((lineNumber) => [lineNumber, [testCase], ProblemStatementIssue.REPEATED_TEST_CASES] as AnalysisItem));

        const repeatedTestCases = uniq(repeatedTestCaseAnalysis.flatMap(([, testCases]) => testCases));

        invalidTestCaseAnalysis.push(...repeatedTestCaseAnalysis);

        return { missingTestCases, invalidTestCases, repeatedTestCases, invalidTestCaseAnalysis };
    };

    /**
     * Merges multiple AnalyseItem[] into one accumulated ProblemStatementAnalysis.
     *
     * @param analysis arbitrary number of analysis objects to be merged into one.
     */
    private mergeAnalysis = (...analysis: Array<AnalysisItem[]>): ProblemStatementAnalysis => {
        const reducer = (acc: ProblemStatementAnalysis, [lineNumber, values, issueType]: AnalysisItem): ProblemStatementAnalysis => {
            const lineNumberValues = acc.get(lineNumber);
            const issueValues = lineNumberValues?.[issueType] ?? [];
            acc.set(lineNumber, { lineNumber, ...lineNumberValues, [issueType]: [...issueValues, ...values] });
            return acc;
        };

        return analysis
            .flat()
            .map(([lineNumber, values, issueType]: AnalysisItem) => [
                lineNumber,
                values.map((id) => this.translateService.instant(this.getTranslationByIssueType(issueType), { id })),
                issueType,
            ])
            .reduce(reducer, new Map());
    };

    /**
     * Matches the issueType to a translation. A given translation should have {{id}} as a parameter.
     *
     * @param issueType for which to retrieve the fitting translation.
     */
    private getTranslationByIssueType = (issueType: ProblemStatementIssue): string => {
        switch (issueType) {
            case ProblemStatementIssue.INVALID_TEST_CASES:
                return INVALID_TEST_CASE_TRANSLATION;
            case ProblemStatementIssue.REPEATED_TEST_CASES:
                return REPEATED_TEST_CASE_TRANSLATION;
        }
        // no default value, please add a new translation when adding new issue types
    };

    /**
     * Extracts the given regex from the task.
     * Value will be null if no match is found!
     *
     * @param tasks that contain the given regex.
     * @param regex to search for in the tasks.
     */
    private extractRegexFromTasks(tasks: [number, string][], regex: RegExp): [number, string[]][] {
        const cleanMatches = (matches: string[]) => matches.flat().filter(Boolean);

        return tasks
            .filter(([, task]) => !!task)
            .map(([lineNumber, task]) => {
                const extractedValue = task.match(regex);
                return extractedValue && extractedValue.length > 1 ? [lineNumber, extractedValue[1]] : [lineNumber, undefined];
            })
            .filter(([, testCases]) => !!testCases)
            .map(([lineNumber, match]: [number, string]) => {
                const cleanedMatches = cleanMatches(match!.split(/,(?![^(]*?\))/).map((m: string) => m.trim()));
                return [lineNumber, cleanedMatches];
            }) as [number, string[]][];
    }
}
