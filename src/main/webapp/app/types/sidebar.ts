import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { DifficultyLevel, Exercise } from 'app/entities/exercise.model';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import dayjs from 'dayjs/esm';
import { ConversationDTO } from 'app/entities/metis/conversation/conversation.model';
import { StudentExam } from 'app/entities/student-exam.model';

export type SidebarCardSize = 'S' | 'M' | 'L';
export type TimeGroupCategory = 'past' | 'current' | 'dueSoon' | 'future' | 'noDate';
export type ExamGroupCategory = 'real' | 'test' | 'attempt';
export type TutorialGroupCategory = 'all' | 'registered' | 'further';
export type SidebarTypes = 'exercise' | 'exam' | 'inExam' | 'conversation' | 'default';
export type AccordionGroups = Record<
    TimeGroupCategory | TutorialGroupCategory | ExamGroupCategory | ChannelGroupCategory | string,
    { entityData: SidebarCardElement[]; isHideCount?: boolean }
>;
export type ChannelGroupCategory =
    | 'favoriteChannels'
    | 'recents'
    | 'generalChannels'
    | 'exerciseChannels'
    | 'lectureChannels'
    | 'groupChats'
    | 'directMessages'
    | 'examChannels'
    | 'feedbackDiscussion'
    | 'savedPosts'
    | 'archivedChannels';
export type CollapseState = {
    [key: string]: boolean;
} & (Record<TimeGroupCategory, boolean> | Record<ChannelGroupCategory, boolean> | Record<ExamGroupCategory, boolean> | Record<TutorialGroupCategory, boolean>);
export type ChannelTypeIcons = Record<ChannelGroupCategory, IconProp>;
export type SidebarItemShowAlways = {
    [key: string]: boolean;
} & (Record<TimeGroupCategory, boolean> | Record<ChannelGroupCategory, boolean> | Record<ExamGroupCategory, boolean> | Record<TutorialGroupCategory, boolean>);

export interface SidebarData {
    groupByCategory: boolean;
    sidebarType?: SidebarTypes;
    groupedData?: AccordionGroups;
    ungroupedData?: SidebarCardElement[];
    storageId?: string;
    showAccordionLeadingIcon?: boolean;
    messagingEnabled?: boolean;
    canCreateChannel?: boolean;
}

export interface SidebarCardElement {
    /**
     * Defines the item's title that will be shown in the card
     */
    title: string;
    /**
     * This is an optional string which may define an icon for the card item.
     * It has to be a valid FontAwesome icon name and will be displayed in the
     * 'regular' style.
     */
    icon?: IconProp;
    /**
     * Defines the item's id that will be used to search for selected
     */
    id: string | number;
    /**
     * If set to true, the icons for quick actions will be displayed on the top right
     */
    quickActionIcons?: any;
    /**
     * If set to true, a subtitle will be displayed on left side
     */
    subtitleLeft?: string;
    /**
     * If set to true, a subtitle will be displayed on right side, special case for exercises will be refactored
     */
    subtitleRight?: string;
    /**
     * If set to true, the item will be displayed as active and, thus, overwrites
     * the routerLinkActive flag.
     */
    active?: boolean;
    /**
     * Sets a router link for the nav item which will be activated by clicking
     * the item.
     */
    routerLink?: string;
    /**
     * Set for Exercises
     */
    type?: string;
    /**
     * Sets the size of SidebarCards
     */
    size: SidebarCardSize;
    /**
     * Set for Exercises, shows the colored border on the left side
     */
    difficulty?: DifficultyLevel;
    /**
     * Set for Exercises
     */
    studentParticipation?: StudentParticipation;
    /**
     * Set for Exercises. Will be removed after refactoring
     */
    exercise?: Exercise;
    /**
     * Set For Exam, this is a string which may define an icon for the status of the exam.
     * It has to be a valid FontAwesome icon name and will be displayed in the
     * 'regular' style. Needed for future implementation
     */
    statusIcon?: IconProp;
    /**
     * Set for Exam, identifies the color of the status icon. Needed for future implementation
     */
    statusIconColor?: string;
    /**
     * Set for Exam, shows the start date and time
     */
    startDateWithTime?: dayjs.Dayjs;
    /**
     * Set for Exam, shows the working time
     */
    workingTime?: number;
    /**
     * Set for Exam, represents the student exam of a real exam to obtain individual working time
     */
    studentExam?: StudentExam;
    /**
     * Set for Exam, shows the maximum attainable Points
     */
    attainablePoints?: number;
    /**
     * Set for Exam, identifies the current status of an exam exercise for exam sidebar
     */
    rightIcon?: IconProp;
    /**
     * Set for Exam, identifies if it is a test exam attempt
     */
    isAttempt?: boolean;
    /**
     * Set For Exam, identifies the number of attempts for each test exam
     */
    attempts?: number;
    /**
     * Set For Exam, identifies if it is a test exam
     */
    testExam?: boolean;
    /**
     * Set For Exam, identifies the submission date for an attempt of a test exam
     */
    submissionDate?: dayjs.Dayjs;
    /**
     * Set For Exam, identifies used working time of a student for an attempt of a test exam
     */
    usedWorkingTime?: number;
    /**
     * Set for Conversation. Will be removed after refactoring
     */
    conversation?: ConversationDTO;

    isCurrent?: boolean;
}
