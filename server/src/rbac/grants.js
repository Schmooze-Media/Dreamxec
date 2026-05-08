const { Roles } = require("./roles");
const { Permissions } = require("./permissions");

const ROLE_GRANTS = {
    [Roles.USER] : [
        Permissions.CAMPAIGN_VIEW,
    ],

    [Roles.STUDENT] : [
        Permissions.CAMPAIGN_VIEW,
        Permissions.CAMPAIGN_CREATE,
        Permissions.CAMPAIGN_OWN_EDIT,
        Permissions.MILESTONE_SUBMIT,
        Permissions.CLUB_JOIN,
        Permissions.DONOR_PROJECT_APPLY,
    ],

    [Roles.ALUMNI] : [
        Permissions.DONATION_MAKE,
        Permissions.MENTOR_APPLY,
    ],

    [Roles.STUDENT_PRESIDENT] : [
        Permissions.CLUB_MANAGE,
        Permissions.CLUB_MEMBER_MANAGE,
        Permissions.CAMPAIGN_TRANSFER_APPROVE,
        Permissions.CAMPAIGN_TRANSFER_INITIATE,
        Permissions.FACULTY_APPROVE,
    ],

    [Roles.MENTOR] : [
        Permissions.CAMPAIGN_VIEW,
        Permissions.SESSION_CREATE,
        Permissions.STUDENT_GUIDE,
        Permissions.MENTOR_PROFILE_MANAGE,
    ],

    [Roles.DONOR] : [
        Permissions.CAMPAIGN_VIEW,
        Permissions.DONATION_MAKE,
        Permissions.DONOR_PROJECT_CREATE,
        Permissions.DONOR_PROJECT_APPS_VIEW,
        Permissions.WISHLIST_MANAGE,
        Permissions.FACULTY_APPROVE,
    ],

    [Roles.PREMIUM_DONOR] : [
        Permissions.ANALYTICS_VIEW,
    ],

    [Roles.FACULTY] : [
        Permissions.CAMPAIGN_VIEW,
        Permissions.CAMPAIGN_REVIEW,
        // campaign:approve is ADMIN only — see spec Section 13.1
        Permissions.MILESTONE_APPROVE,
        Permissions.MILESTONE_REJECT,
        Permissions.CLUB_VERIFY,
    ],

    [Roles.DEAN_ACADEMICS] : [
        Permissions.ACADEMIC_MANAGE,
    ],

    [Roles.DEAN_STUDENT_WELFARE] :[
        //inherits faculty
        Permissions.WELFARE_MANAGE,
    ],

    [Roles.DEAN_HEAD] : [
        // inherits dean academics + dean_student_welfare
        Permissions.FACULTY_MANAGE,
    ],

    [Roles.ADMIN] : [
        Permissions.ALL, 
    ],
};

module.exports = { ROLE_GRANTS };