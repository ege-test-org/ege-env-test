import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TextExercise } from 'app/entities/text/text-exercise.model';
import { ExercisePagingService } from 'app/exercise/manage/exercise-paging.service';

@Injectable({ providedIn: 'root' })
export class TextExercisePagingService extends ExercisePagingService<TextExercise> {
    private static readonly RESOURCE_URL = 'api/text/text-exercises';

    constructor() {
        const http = inject(HttpClient);
        super(http, TextExercisePagingService.RESOURCE_URL);
    }
}
