import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { Range } from 'app/shared/util/utils';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { PlagiarismRunDetailsComponent } from 'app/plagiarism/manage/plagiarism-run-details/plagiarism-run-details.component';
import { PlagiarismInspectorService } from 'app/plagiarism/manage/plagiarism-inspector/plagiarism-inspector.service';

describe('Plagiarism Run Details', () => {
    let comp: PlagiarismRunDetailsComponent;
    let fixture: ComponentFixture<PlagiarismRunDetailsComponent>;

    let injectorService: PlagiarismInspectorService;

    const plagiarismResult = {
        duration: 5200,
        similarityDistribution: [24, 18, 16, 13, 7, 9, 5, 4, 0, 1],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: TranslateService, useClass: MockTranslateService }],
        }).compileComponents();

        fixture = TestBed.createComponent(PlagiarismRunDetailsComponent);
        comp = fixture.componentInstance;

        injectorService = TestBed.inject(PlagiarismInspectorService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('updates chart data on changes', () => {
        jest.spyOn(comp, 'updateChartDataSet');
        jest.spyOn(injectorService, 'filterComparisons').mockReturnValue([]);

        comp.ngOnChanges({
            plagiarismResult: { currentValue: plagiarismResult } as SimpleChange,
        });

        expect(comp.updateChartDataSet).toHaveBeenCalledOnce();
        for (let i = 0; i < 10; i++) {
            expect(comp.ngxData[i].value).toBe(plagiarismResult.similarityDistribution[i]);
        }
    });

    it('updates the chart data correctly', () => {
        expect(comp.ngxData).toHaveLength(0);

        comp.updateChartDataSet([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

        expect(comp.ngxData).toHaveLength(10);
    });

    it('sets BucketDTOs', () => {
        const filterComparisonsMock = jest.spyOn(injectorService, 'filterComparisons').mockReturnValue([]);

        comp.ngOnChanges({
            plagiarismResult: { currentValue: plagiarismResult } as SimpleChange,
        });

        expect(filterComparisonsMock).toHaveBeenCalledTimes(10);
        expect(comp.bucketDTOs).toHaveLength(10);
    });

    it.each([0, 10, 20, 30, 40, 50, 60, 70, 80, 90])('emits the correct range if bar is selected', (minimumBorder: number) => {
        const similaritySelectedStub = jest.spyOn(comp.similaritySelected, 'emit').mockImplementation();
        const maximumBorder = minimumBorder + 10;

        const event = { name: '[' + minimumBorder + '%-' + maximumBorder + '%)' };

        comp.onSelect(event);

        expect(similaritySelectedStub).toHaveBeenCalledOnce();
        expect(similaritySelectedStub).toHaveBeenCalledWith(new Range(minimumBorder, maximumBorder));
        jest.restoreAllMocks();
    });

    it.each([1, 2, 3])('return correct bucketDTO', (label: number) => {
        comp.ngxChartLabels = ['1', '2', '3'];
        comp.bucketDTOs = [
            { confirmed: 1, denied: 1, open: 1 },
            { confirmed: 2, denied: 2, open: 2 },
            { confirmed: 3, denied: 3, open: 3 },
        ];

        const result = comp.getBucketDTO(label.toString());

        expect(result.confirmed).toBe(label);
        expect(result.denied).toBe(label);
        expect(result.open).toBe(label);
    });
});
