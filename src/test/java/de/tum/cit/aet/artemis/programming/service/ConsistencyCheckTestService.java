package de.tum.cit.aet.artemis.programming.service;

import static org.assertj.core.api.Assertions.assertThat;
import static tech.jhipster.config.JHipsterConstants.SPRING_PROFILE_TEST;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.core.domain.User;
import de.tum.cit.aet.artemis.core.test_repository.UserTestRepository;
import de.tum.cit.aet.artemis.core.user.util.UserUtilService;
import de.tum.cit.aet.artemis.core.util.RequestUtilService;
import de.tum.cit.aet.artemis.programming.domain.ProgrammingExercise;
import de.tum.cit.aet.artemis.programming.dto.ConsistencyErrorDTO;
import de.tum.cit.aet.artemis.programming.test_repository.ProgrammingExerciseTestRepository;
import de.tum.cit.aet.artemis.programming.util.MockDelegate;
import de.tum.cit.aet.artemis.programming.util.ProgrammingExerciseUtilService;

/**
 * Note: this class should be independent of the actual VCS and CIS and contains common test logic for scenarios:
 * 1) Jenkins + LocalVc
 */
@Service
@Profile(SPRING_PROFILE_TEST)
public class ConsistencyCheckTestService {

    @Autowired
    private RequestUtilService request;

    @Autowired
    private ProgrammingExerciseTestRepository programmingExerciseRepository;

    @Autowired
    private UserTestRepository userRepository;

    @Autowired
    private ProgrammingExerciseUtilService programmingExerciseUtilService;

    @Autowired
    private UserUtilService userUtilService;

    public Course course;

    private MockDelegate mockDelegate;

    public void setup(MockDelegate mockDelegate) throws Exception {
        this.mockDelegate = mockDelegate;
        course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        User user = userUtilService.createAndSaveUser("instructor1");
        Set<String> groups = new HashSet<>();
        groups.add(course.getInstructorGroupName());
        user.setGroups(groups);
        userRepository.save(user);
    }

    /**
     * Test consistencyCheck feature with programming exercise without
     * inconsistencies
     *
     * @throws Exception if an error occurs
     */
    public void testCheckConsistencyOfProgrammingExercise_noErrors() throws Exception {
        var exercise = (ProgrammingExercise) course.getExercises().iterator().next();
        exercise = programmingExerciseRepository.findByIdWithTemplateAndSolutionParticipationElseThrow(exercise.getId());

        mockDelegate.mockCheckIfProjectExistsInVcs(exercise, true);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsTemplateRepositoryUri(), exercise.getProjectKey(), true);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsTestRepositoryUri(), exercise.getProjectKey(), true);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsSolutionRepositoryUri(), exercise.getProjectKey(), true);
        mockDelegate.mockCheckIfBuildPlanExists(exercise.getProjectKey(), exercise.getTemplateBuildPlanId(), true, false);
        mockDelegate.mockCheckIfBuildPlanExists(exercise.getProjectKey(), exercise.getSolutionBuildPlanId(), true, false);

        var consistencyErrors = request.getList("/api/exercise/programming-exercises/" + exercise.getId() + "/consistency-check", HttpStatus.OK, ConsistencyErrorDTO.class);
        assertThat(consistencyErrors).isEmpty();
    }

    /**
     * Test consistencyCheck feature with programming exercise
     * with missing VCS project
     *
     * @throws Exception if an error occurs
     */
    public void testCheckConsistencyOfProgrammingExercise_missingVCSProject() throws Exception {
        var exercise = (ProgrammingExercise) course.getExercises().iterator().next();
        exercise = programmingExerciseRepository.findByIdWithTemplateAndSolutionParticipationElseThrow(exercise.getId());

        mockDelegate.mockCheckIfProjectExistsInVcs(exercise, false);
        mockDelegate.mockCheckIfBuildPlanExists(exercise.getProjectKey(), exercise.getTemplateBuildPlanId(), true, false);
        mockDelegate.mockCheckIfBuildPlanExists(exercise.getProjectKey(), exercise.getSolutionBuildPlanId(), true, false);

        var consistencyErrors = request.getList("/api/exercise/programming-exercises/" + exercise.getId() + "/consistency-check", HttpStatus.OK, ConsistencyErrorDTO.class);
        assertThat(consistencyErrors).hasSize(1);
        assertThat(consistencyErrors.getFirst().type()).isEqualTo(ConsistencyErrorDTO.ErrorType.VCS_PROJECT_MISSING);
    }

    /**
     * Test consistencyCheck feature with programming exercise
     * with missing VCS repositories
     *
     * @throws Exception if an error occurs
     */
    public void testCheckConsistencyOfProgrammingExercise_missingVCSRepos() throws Exception {
        var exercise = (ProgrammingExercise) course.getExercises().iterator().next();
        exercise = programmingExerciseRepository.findByIdWithTemplateAndSolutionParticipationElseThrow(exercise.getId());

        mockDelegate.mockCheckIfProjectExistsInVcs(exercise, true);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsTemplateRepositoryUri(), exercise.getProjectKey(), false);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsTestRepositoryUri(), exercise.getProjectKey(), false);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsSolutionRepositoryUri(), exercise.getProjectKey(), false);
        mockDelegate.mockCheckIfBuildPlanExists(exercise.getProjectKey(), exercise.getTemplateBuildPlanId(), true, false);
        mockDelegate.mockCheckIfBuildPlanExists(exercise.getProjectKey(), exercise.getSolutionBuildPlanId(), true, false);

        List<ConsistencyErrorDTO> expectedErrors = new ArrayList<>();
        expectedErrors.add(new ConsistencyErrorDTO(exercise, ConsistencyErrorDTO.ErrorType.TEMPLATE_REPO_MISSING));
        expectedErrors.add(new ConsistencyErrorDTO(exercise, ConsistencyErrorDTO.ErrorType.SOLUTION_REPO_MISSING));
        expectedErrors.add(new ConsistencyErrorDTO(exercise, ConsistencyErrorDTO.ErrorType.TEST_REPO_MISSING));

        var consistencyErrors = request.getList("/api/exercise/programming-exercises/" + exercise.getId() + "/consistency-check", HttpStatus.OK, ConsistencyErrorDTO.class);
        assertThat(consistencyErrors).hasSize(3).containsAll(expectedErrors);
    }

    /**
     * Test consistencyCheck feature with programming exercise
     * with missing Build Plans
     *
     * @throws Exception if an error occurs
     */
    public void testCheckConsistencyOfProgrammingExercise_buildPlansMissing() throws Exception {
        var exercise = (ProgrammingExercise) course.getExercises().iterator().next();
        exercise = programmingExerciseRepository.findByIdWithTemplateAndSolutionParticipationElseThrow(exercise.getId());

        mockDelegate.mockCheckIfProjectExistsInVcs(exercise, true);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsTemplateRepositoryUri(), exercise.getProjectKey(), true);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsTestRepositoryUri(), exercise.getProjectKey(), true);
        mockDelegate.mockRepositoryUriIsValid(exercise.getVcsSolutionRepositoryUri(), exercise.getProjectKey(), true);
        mockDelegate.mockCheckIfBuildPlanExists(exercise.getProjectKey(), exercise.getTemplateBuildPlanId(), false, false);
        mockDelegate.mockCheckIfBuildPlanExists(exercise.getProjectKey(), exercise.getSolutionBuildPlanId(), false, false);

        List<ConsistencyErrorDTO> expectedErrors = new ArrayList<>();
        expectedErrors.add(new ConsistencyErrorDTO(exercise, ConsistencyErrorDTO.ErrorType.TEMPLATE_BUILD_PLAN_MISSING));
        expectedErrors.add(new ConsistencyErrorDTO(exercise, ConsistencyErrorDTO.ErrorType.SOLUTION_BUILD_PLAN_MISSING));

        var consistencyErrors = request.getList("/api/exercise/programming-exercises/" + exercise.getId() + "/consistency-check", HttpStatus.OK, ConsistencyErrorDTO.class);
        assertThat(consistencyErrors).hasSize(2);
        assertThat(consistencyErrors).containsAll(expectedErrors);

    }

    /**
     * Test consistencyCheck REST Endpoint with unauthorized user
     *
     * @throws Exception if an error occurs
     */
    public void testCheckConsistencyOfProgrammingExercise_forbidden() throws Exception {
        // remove user from course group to simulate an unauthorized situation
        User notAuthorizedUser = userRepository.getUser();
        notAuthorizedUser.setGroups(new HashSet<>());
        userRepository.save(notAuthorizedUser);

        var exercise = (ProgrammingExercise) course.getExercises().iterator().next();
        request.get("/api/exercise/programming-exercises/" + exercise.getId() + "/consistency-check", HttpStatus.FORBIDDEN, ConsistencyErrorDTO.class);
    }
}
