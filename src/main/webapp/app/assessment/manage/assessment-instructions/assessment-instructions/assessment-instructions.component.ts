import { Component, Input, inject } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { UMLDiagramType, UMLModel } from '@ls1intum/apollon';
import { ArtemisMarkdownService } from 'app/shared/markdown.service';
import { Exercise, ExerciseType } from 'app/entities/exercise.model';
import { TextExercise } from 'app/entities/text/text-exercise.model';
import { ModelingExercise } from 'app/entities/modeling-exercise.model';
import { FileUploadExercise } from 'app/entities/file-upload-exercise.model';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { GradingCriterion } from 'app/exercise/structured-grading-criterion/grading-criterion.model';
import { ProgrammingExerciseStudentParticipation } from 'app/entities/participation/programming-exercise-student-participation.model';
import { ExpandableSectionComponent } from '../expandable-section/expandable-section.component';
import { StructuredGradingInstructionsAssessmentLayoutComponent } from 'app/assessment/manage/structured-grading-instructions-assessment-layout/structured-grading-instructions-assessment-layout.component';
import { ProgrammingExerciseInstructionComponent } from 'app/programming/shared/instructions-render/programming-exercise-instruction.component';
import { SecureLinkDirective } from 'app/shared/http/secure-link.directive';
import { ButtonComponent } from 'app/shared/components/button.component';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { ModelingEditorComponent } from 'app/modeling/shared/modeling-editor.component';

@Component({
    selector: 'jhi-assessment-instructions',
    templateUrl: './assessment-instructions.component.html',
    imports: [
        ExpandableSectionComponent,
        StructuredGradingInstructionsAssessmentLayoutComponent,
        // TODO: the extension point for Orion does not work with Angular 19, we need to find a different solution
        // ExtensionPointDirective,
        ProgrammingExerciseInstructionComponent,
        SecureLinkDirective,
        ButtonComponent,
        TranslateDirective,
        ModelingEditorComponent,
    ],
})
export class AssessmentInstructionsComponent {
    private markdownService = inject(ArtemisMarkdownService);

    exercise: Exercise;
    programmingExercise?: ProgrammingExercise;
    problemStatement: SafeHtml;
    gradingInstructions?: SafeHtml;
    sampleSolutionExplanation?: SafeHtml;
    sampleSolutionModel?: UMLModel;
    sampleSolutionDiagramType?: UMLDiagramType;

    @Input() isAssessmentTraining = false;
    @Input() showAssessmentInstructions = true;

    @Input() readOnly: boolean;
    // For programming exercises we hand over the participation or use the template participation
    @Input() programmingParticipation?: ProgrammingExerciseStudentParticipation;
    @Input() gradingCriteria?: GradingCriterion[];

    readonly ExerciseType = ExerciseType;

    // extension points, see shared/extension-point
    // TODO: the extension point for Orion does not work with Angular 19, we need to find a different solution
    // @ContentChild('overrideTitle') overrideTitle: TemplateRef<any>;

    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input('exercise') set exerciseInput(exercise: Exercise) {
        this.exercise = exercise;
        this.problemStatement = this.markdownService.safeHtmlForMarkdown(exercise.problemStatement);
        if (exercise.gradingInstructions) {
            this.gradingInstructions = this.markdownService.safeHtmlForMarkdown(exercise.gradingInstructions);
        }
        this.gradingCriteria = exercise.gradingCriteria;

        let sampleSolutionMarkdown: string | undefined;
        switch (exercise.type) {
            case ExerciseType.MODELING:
                const modelingExercise = exercise as ModelingExercise;
                sampleSolutionMarkdown = modelingExercise.exampleSolutionExplanation;
                if (modelingExercise.exampleSolutionModel) {
                    this.sampleSolutionModel = JSON.parse(modelingExercise.exampleSolutionModel);
                }
                this.sampleSolutionDiagramType = modelingExercise.diagramType;
                break;
            case ExerciseType.TEXT:
                const textExercise = exercise as TextExercise;
                sampleSolutionMarkdown = textExercise.exampleSolution;
                break;
            case ExerciseType.FILE_UPLOAD:
                const fileUploadExercise = exercise as FileUploadExercise;
                sampleSolutionMarkdown = fileUploadExercise.exampleSolution;
                break;
            case ExerciseType.PROGRAMMING:
                this.programmingExercise = exercise as ProgrammingExercise;
        }
        if (sampleSolutionMarkdown) {
            this.sampleSolutionExplanation = this.markdownService.safeHtmlForMarkdown(sampleSolutionMarkdown);
        }
    }
}
