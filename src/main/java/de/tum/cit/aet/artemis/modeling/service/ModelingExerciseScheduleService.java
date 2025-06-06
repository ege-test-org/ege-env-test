package de.tum.cit.aet.artemis.modeling.service;

import static de.tum.cit.aet.artemis.core.config.Constants.EXAM_END_WAIT_TIME_FOR_COMPASS_MINUTES;
import static de.tum.cit.aet.artemis.core.config.Constants.PROFILE_CORE_AND_SCHEDULING;
import static de.tum.cit.aet.artemis.core.config.StartupDelayConfig.MODELING_EXERCISE_SCHEDULE_DELAY_SEC;
import static java.time.Instant.now;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import jakarta.validation.constraints.NotNull;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import de.tum.cit.aet.artemis.assessment.domain.AssessmentType;
import de.tum.cit.aet.artemis.core.exception.EntityNotFoundException;
import de.tum.cit.aet.artemis.core.security.SecurityUtils;
import de.tum.cit.aet.artemis.core.service.ScheduleService;
import de.tum.cit.aet.artemis.exam.service.ExamDateService;
import de.tum.cit.aet.artemis.exercise.domain.ExerciseLifecycle;
import de.tum.cit.aet.artemis.exercise.service.IExerciseScheduleService;
import de.tum.cit.aet.artemis.modeling.domain.ModelingExercise;
import de.tum.cit.aet.artemis.modeling.repository.ModelingExerciseRepository;
import de.tum.cit.aet.artemis.modeling.service.compass.CompassService;
import tech.jhipster.config.JHipsterConstants;

@Service
@Profile(PROFILE_CORE_AND_SCHEDULING)
public class ModelingExerciseScheduleService implements IExerciseScheduleService<ModelingExercise> {

    private static final Logger log = LoggerFactory.getLogger(ModelingExerciseScheduleService.class);

    private final ScheduleService scheduleService;

    private final Environment env;

    private final ModelingExerciseRepository modelingExerciseRepository;

    private final CompassService compassService;

    private final TaskScheduler scheduler;

    private final ExamDateService examDateService;

    public ModelingExerciseScheduleService(ScheduleService scheduleService, ModelingExerciseRepository modelingExerciseRepository, Environment env, CompassService compassService,
            ExamDateService examDateService, @Qualifier("taskScheduler") TaskScheduler scheduler) {
        this.scheduleService = scheduleService;
        this.env = env;
        this.modelingExerciseRepository = modelingExerciseRepository;
        this.compassService = compassService;
        this.scheduler = scheduler;
        this.examDateService = examDateService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void applicationReady() {
        // schedule the task after the application has started to avoid delaying the start of the application
        scheduler.schedule(this::scheduleRunningExercisesOnStartup, Instant.now().plusSeconds(MODELING_EXERCISE_SCHEDULE_DELAY_SEC));
    }

    @Override
    public void scheduleRunningExercisesOnStartup() {
        try {
            Collection<String> activeProfiles = Arrays.asList(env.getActiveProfiles());
            if (activeProfiles.contains(JHipsterConstants.SPRING_PROFILE_DEVELOPMENT)) {
                // only execute this on production server, i.e. when the prod profile is active
                // NOTE: if you want to test this locally, please comment it out, but do not commit the changes
                return;
            }
            SecurityUtils.setAuthorizationObject();

            List<ModelingExercise> exercisesToBeScheduled = modelingExerciseRepository.findAllToBeScheduled(ZonedDateTime.now());
            exercisesToBeScheduled.forEach(this::scheduleExercise);

            List<ModelingExercise> modelingExercisesWithExam = modelingExerciseRepository.findAllWithEagerExamByExamEndDateAfterDate(ZonedDateTime.now());
            modelingExercisesWithExam.forEach(this::scheduleExamExercise);

            log.info("Scheduled {} modeling exercises.", exercisesToBeScheduled.size());
            log.info("Scheduled {} exam modeling exercises.", modelingExercisesWithExam.size());
        }
        catch (Exception e) {
            log.error("Failed to start ModelingExerciseScheduleService", e);
        }
    }

    @Override
    public void updateScheduling(ModelingExercise exercise) {
        if (!needsToBeScheduled(exercise)) {
            // If a modeling exercise got changed so that any scheduling becomes unnecessary, we need to cancel all scheduled tasks
            cancelAllScheduledTasks(exercise);
            return;
        }
        scheduleExercise(exercise);
    }

    private static boolean needsToBeScheduled(ModelingExercise exercise) {
        if (exercise.getAssessmentType() != AssessmentType.SEMI_AUTOMATIC) {
            return false;
        }

        // Exam exercises need to be scheduled
        if (exercise.isExamExercise()) {
            return true;
        }

        final ZonedDateTime now = ZonedDateTime.now();
        // Semi-automatically assessed modeling exercises as well
        // Has a regular due date in the future
        return exercise.getDueDate() != null && now.isBefore(exercise.getDueDate());
    }

    private void scheduleExercise(ModelingExercise exercise) {
        try {
            if (exercise.isExamExercise()) {
                scheduleExamExercise(exercise);
            }
            else {
                scheduleCourseExercise(exercise);
            }
        }
        catch (Exception e) {
            log.error("Failed to schedule exercise {}", exercise.getId(), e);
        }
    }

    private void scheduleCourseExercise(ModelingExercise exercise) {
        if (!SecurityUtils.isAuthenticated()) {
            SecurityUtils.setAuthorizationObject();
        }

        // For any course exercise that needsToBeScheduled (buildAndTestAfterDueDate and/or manual assessment)
        if (exercise.getDueDate() != null && ZonedDateTime.now().isBefore(exercise.getDueDate())) {
            scheduleService.scheduleExerciseTask(exercise, ExerciseLifecycle.DUE, () -> buildModelingClusters(exercise).run(), "build modeling clusters after due date");
            log.debug("Scheduled build modeling clusters after due date for Modeling Exercise '{}' (#{}) for {}.", exercise.getTitle(), exercise.getId(), exercise.getDueDate());
        }
        else {
            scheduleService.cancelScheduledTaskForLifecycle(exercise.getId(), ExerciseLifecycle.DUE);
        }
    }

    private void scheduleExamExercise(ModelingExercise exercise) {
        var exam = exercise.getExerciseGroup().getExam();
        var endDate = examDateService.getLatestIndividualExamEndDateWithGracePeriod(exam);
        if (endDate == null) {
            log.error("Modeling exercise {} for exam {} cannot be scheduled properly, end date is not set", exercise.getId(), exam.getId());
            return;
        }
        if (ZonedDateTime.now().isBefore(examDateService.getLatestIndividualExamEndDateWithGracePeriod(exam))) {
            var buildDate = endDate.plusMinutes(EXAM_END_WAIT_TIME_FOR_COMPASS_MINUTES);
            exercise.setClusterBuildDate(buildDate);
            scheduleService.scheduleExerciseTask(exercise, ExerciseLifecycle.BUILD_COMPASS_CLUSTERS_AFTER_EXAM, () -> buildModelingClusters(exercise).run(),
                    "build modeling clusters after exam");
        }
        log.debug("Scheduled Exam Modeling Exercise '{}' (#{}).", exercise.getTitle(), exercise.getId());
    }

    /**
     * Schedule a cluster building task for a modeling exercise to start immediately.
     *
     * @param exercise exercise to build clusters for
     */
    public void scheduleExerciseForInstant(ModelingExercise exercise) {
        scheduler.schedule(buildModelingClusters(exercise), now());
    }

    /**
     * Returns a runnable that, once executed, will build modeling clusters
     * <p>
     * NOTE: this will not build modeling clusters as only a Runnable is returned!
     *
     * @param exercise The exercise for which the clusters will be created
     * @return a Runnable that will build clusters once it is executed
     */
    @NotNull
    private Runnable buildModelingClusters(ModelingExercise exercise) {
        Long modelingExerciseId = exercise.getId();
        return () -> {
            SecurityUtils.setAuthorizationObject();
            try {
                Optional<ModelingExercise> modelingExercise = modelingExerciseRepository.findById(modelingExerciseId);
                if (modelingExercise.isEmpty()) {
                    throw new EntityNotFoundException("modeling exercise not found with id " + modelingExerciseId);
                }

                compassService.build(modelingExercise.get());

            }
            catch (EntityNotFoundException ex) {
                log.error("Modeling exercise with id {} is no longer available in database for use in scheduled task.", modelingExerciseId);
            }
        };
    }

    private void cancelAllScheduledTasks(ModelingExercise exercise) {
        cancelAllScheduledTasks(exercise.getId());
    }

    /**
     * Cancel all scheduled tasks for a modeling exercise.
     * - Release
     * - Due
     * - Build & Test after due date
     * - Assessment due date
     *
     * @param exerciseId the id of the exercise for which the tasks should be cancelled
     */
    public void cancelAllScheduledTasks(Long exerciseId) {
        scheduleService.cancelScheduledTaskForLifecycle(exerciseId, ExerciseLifecycle.RELEASE);
        scheduleService.cancelScheduledTaskForLifecycle(exerciseId, ExerciseLifecycle.DUE);
        scheduleService.cancelScheduledTaskForLifecycle(exerciseId, ExerciseLifecycle.BUILD_AND_TEST_AFTER_DUE_DATE);
        scheduleService.cancelScheduledTaskForLifecycle(exerciseId, ExerciseLifecycle.ASSESSMENT_DUE);
        scheduleService.cancelScheduledTaskForLifecycle(exerciseId, ExerciseLifecycle.BUILD_COMPASS_CLUSTERS_AFTER_EXAM);
    }
}
