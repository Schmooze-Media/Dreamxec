const { Roles } = require('./roles');

const ROLE_INHERITANCE = {
    [Roles.ALUMNI]:                 [Roles.USER],
    [Roles.STUDENT_PRESIDENT]:      [Roles.STUDENT],
    [Roles.PREMIUM_DONOR]:          [Roles.DONOR],
    [Roles.DEAN_ACADEMICS]:         [Roles.FACULTY],
    [Roles.DEAN_STUDENT_WELFARE]:   [Roles.FACULTY],

    // DEAN_HEAD inherits from both deans, which each inherit FACULTY
    [Roles.DEAN_HEAD]:              [Roles.DEAN_ACADEMICS, Roles.DEAN_STUDENT_WELFARE],
};

module.exports = { ROLE_INHERITANCE };
