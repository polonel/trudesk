## [1.0.9](https://github.com/polonel/trudesk/compare/v1.0.8...v1.0.9) (2019-03-20)


### Bug Fixes

* **accounts:** import failing due to role changes ([893af61](https://github.com/polonel/trudesk/commit/893af61))
* **mailcheck:** [#170](https://github.com/polonel/trudesk/issues/170) ([10c36fa](https://github.com/polonel/trudesk/commit/10c36fa))
* **tps:** missing host name in some cases ([c3704b5](https://github.com/polonel/trudesk/commit/c3704b5))

## [1.0.8](https://github.com/polonel/trudesk/compare/v1.0.7...v1.0.8) (2019-03-17)


### Bug Fixes

* **accounts:** new users have accessToken by default ([4f36bb4](https://github.com/polonel/trudesk/commit/4f36bb4))
* **accounts:** space between group names ([24a590b](https://github.com/polonel/trudesk/commit/24a590b))
* **mailer:** new-ticket template showing large profile pic ([213bc05](https://github.com/polonel/trudesk/commit/213bc05))
* **signup:** [#167](https://github.com/polonel/trudesk/issues/167) ([5828301](https://github.com/polonel/trudesk/commit/5828301))
* **theme:** dark theme dropdown select color ([53751bd](https://github.com/polonel/trudesk/commit/53751bd))

## [1.0.7](https://github.com/polonel/trudesk/compare/v1.0.6...v1.0.7) (2019-03-12)


### Bug Fixes

* **accounts:** missing account creation modal [#152](https://github.com/polonel/trudesk/issues/152) ([b2cbbda](https://github.com/polonel/trudesk/commit/b2cbbda))
* **app:** app.js for universal config ([a318545](https://github.com/polonel/trudesk/commit/a318545))
* **app:** callback failed if mailcheck was enabled ([1520ad5](https://github.com/polonel/trudesk/commit/1520ad5))
* **build:** incorrect import dep ([a180497](https://github.com/polonel/trudesk/commit/a180497))
* **chat:** removed self from online user list ([de3a596](https://github.com/polonel/trudesk/commit/de3a596))
* **component:** easymde handle defaultValue ([b33eb44](https://github.com/polonel/trudesk/commit/b33eb44))
* **components:** button display incorrectly when width is set ([1693421](https://github.com/polonel/trudesk/commit/1693421))
* **debug:** populate db with new role permissions ([2bc5ca6](https://github.com/polonel/trudesk/commit/2bc5ca6))
* **docker:** env var ([ffe26b4](https://github.com/polonel/trudesk/commit/ffe26b4))
* **docker:** universal config ([a338f3a](https://github.com/polonel/trudesk/commit/a338f3a))
* **docker:** universal config ([35acf04](https://github.com/polonel/trudesk/commit/35acf04))
* **images:** profile images not displaying in new email templats ([e89f2f8](https://github.com/polonel/trudesk/commit/e89f2f8))
* **install:** crash ([4199e03](https://github.com/polonel/trudesk/commit/4199e03))
* **migration:** crash if certain role types didn't exist ([39dfaa2](https://github.com/polonel/trudesk/commit/39dfaa2))
* **mobile:** loading issue ([54c2cdd](https://github.com/polonel/trudesk/commit/54c2cdd))
* **mobile:** mobile was showing blank view ([b8b6e3e](https://github.com/polonel/trudesk/commit/b8b6e3e))
* **notifications:** issue with push notification during ticket creation ([77dac9a](https://github.com/polonel/trudesk/commit/77dac9a))
* **permissions:** default user role unable to login correctly [#153](https://github.com/polonel/trudesk/issues/153) ([1b1cec1](https://github.com/polonel/trudesk/commit/1b1cec1))
* **permissions:** disabled accounts showing in assignee list ([ebe6504](https://github.com/polonel/trudesk/commit/ebe6504))
* **permissions:** groups nav incorrectly showing ([65d8fe9](https://github.com/polonel/trudesk/commit/65d8fe9))
* **permissions:** incorrect permissions on edit ticket ([4a75aed](https://github.com/polonel/trudesk/commit/4a75aed))
* **permissions:** missing add comment button ([c512b8d](https://github.com/polonel/trudesk/commit/c512b8d))
* **permissions:** roles allowed to edit ticket after socket update ([1f529f8](https://github.com/polonel/trudesk/commit/1f529f8))
* package.json to reduce vulnerabilities ([025136c](https://github.com/polonel/trudesk/commit/025136c))
* **react:** multiple renders ([1a9cb7b](https://github.com/polonel/trudesk/commit/1a9cb7b))
* **sidebar:** incorrect style on active item ([df338b6](https://github.com/polonel/trudesk/commit/df338b6))
* **sidebar:** overlapping page content [#151](https://github.com/polonel/trudesk/issues/151) ([20235f7](https://github.com/polonel/trudesk/commit/20235f7))
* **test:** updates for role permissions ([7a0479d](https://github.com/polonel/trudesk/commit/7a0479d))
* **ticket:** editing subject disappearing ([53e62d7](https://github.com/polonel/trudesk/commit/53e62d7))
* **ui:** bug displaying view all notifications ([61e4bca](https://github.com/polonel/trudesk/commit/61e4bca))
* **ui:** grid not resizing correctly ([235c960](https://github.com/polonel/trudesk/commit/235c960))


### Performance Improvements

* **code:** cleanup ([362c4f3](https://github.com/polonel/trudesk/commit/362c4f3))
* **restore:** flushRoles on successful restore ([7b44537](https://github.com/polonel/trudesk/commit/7b44537))

## [1.0.6](https://github.com/polonel/trudesk/compare/v1.0.5...v1.0.6) (2019-02-02)


### Bug Fixes

* **attachments:** uploading office mime-types [#140](https://github.com/polonel/trudesk/issues/140) ([b47da40](https://github.com/polonel/trudesk/commit/b47da40))
* **chat:** chat boxes under some buttons ([c337c76](https://github.com/polonel/trudesk/commit/c337c76))
* **dates:** overdue on dashboard ([921e258](https://github.com/polonel/trudesk/commit/921e258))
* **editor:** crash on invalid directory ([bc60899](https://github.com/polonel/trudesk/commit/bc60899))
* **groups:** issue preventing save ([7208253](https://github.com/polonel/trudesk/commit/7208253))
* **ldap:** crash if no results are returned ([8ff63ba](https://github.com/polonel/trudesk/commit/8ff63ba))
* **login:** username whitespaces ([282d725](https://github.com/polonel/trudesk/commit/282d725))
* **messages:** remove ajax link from start conversation ([988dfa9](https://github.com/polonel/trudesk/commit/988dfa9))
* **notifications:** unable to clear all notifications ([4f24c8c](https://github.com/polonel/trudesk/commit/4f24c8c))
* **reports:** invalid date format ([808a740](https://github.com/polonel/trudesk/commit/808a740))
* **reports:** invalid date string ([0914d91](https://github.com/polonel/trudesk/commit/0914d91))
* **socket:** high memory usage on notification updates ([b647d4c](https://github.com/polonel/trudesk/commit/b647d4c))
* **ticket:** priority not updating in realtime ([721f42d](https://github.com/polonel/trudesk/commit/721f42d))
* **unzip:** out dated dependency [#139](https://github.com/polonel/trudesk/issues/139) ([b0aab01](https://github.com/polonel/trudesk/commit/b0aab01))
* **url:** invalid parse ([1738287](https://github.com/polonel/trudesk/commit/1738287))
* **validation:** email validation for modern tlds [#130](https://github.com/polonel/trudesk/issues/130) ([febcbdf](https://github.com/polonel/trudesk/commit/febcbdf))

## [1.0.6](https://github.com/polonel/trudesk/compare/v1.0.5...v1.0.6) (2019-02-02)


### Bug Fixes

* **attachments:** uploading office mime-types [#140](https://github.com/polonel/trudesk/issues/140) ([b47da40](https://github.com/polonel/trudesk/commit/b47da40))
* **chat:** chat boxes under some buttons ([c337c76](https://github.com/polonel/trudesk/commit/c337c76))
* **dates:** overdue on dashboard ([921e258](https://github.com/polonel/trudesk/commit/921e258))
* **groups:** issue preventing save ([7208253](https://github.com/polonel/trudesk/commit/7208253))
* **ldap:** crash if no results are returned ([8ff63ba](https://github.com/polonel/trudesk/commit/8ff63ba))
* **login:** username whitespaces ([282d725](https://github.com/polonel/trudesk/commit/282d725))
* **messages:** remove ajax link from start conversation ([988dfa9](https://github.com/polonel/trudesk/commit/988dfa9))
* **notifications:** unable to clear all notifications ([4f24c8c](https://github.com/polonel/trudesk/commit/4f24c8c))
* **reports:** invalid date format ([808a740](https://github.com/polonel/trudesk/commit/808a740))
* **reports:** invalid date string ([0914d91](https://github.com/polonel/trudesk/commit/0914d91))
* **socket:** high memory usage on notification updates ([b647d4c](https://github.com/polonel/trudesk/commit/b647d4c))
* **ticket:** priority not updating in realtime ([721f42d](https://github.com/polonel/trudesk/commit/721f42d))
* **unzip:** out dated dependency [#139](https://github.com/polonel/trudesk/issues/139) ([b0aab01](https://github.com/polonel/trudesk/commit/b0aab01))
* **url:** invalid parse ([1738287](https://github.com/polonel/trudesk/commit/1738287))
* **validation:** email validation for modern tlds [#130](https://github.com/polonel/trudesk/issues/130) ([febcbdf](https://github.com/polonel/trudesk/commit/febcbdf))

## [1.0.5](https://github.com/polonel/trudesk/compare/v1.0.4...v1.0.5) (2019-01-09)


### Bug Fixes

* **api:** tickets [#124](https://github.com/polonel/trudesk/issues/124) - unable to update ticket status ([ab614a4](https://github.com/polonel/trudesk/commit/ab614a4))
* **backup:** crash on restore ([a613612](https://github.com/polonel/trudesk/commit/a613612))
* **backup:** restore directory fails to create ([d68a045](https://github.com/polonel/trudesk/commit/d68a045))
* **backup:** restore sending error response to soon ([605c8d8](https://github.com/polonel/trudesk/commit/605c8d8))
* **mailcheck:** event leak ([23eaab3](https://github.com/polonel/trudesk/commit/23eaab3))
* **nav:** disappearing dashboard button ([32a4e87](https://github.com/polonel/trudesk/commit/32a4e87))
* **overdue:** overdue card showing incorrect tickets ([72e2584](https://github.com/polonel/trudesk/commit/72e2584))
* **tags:** tags with min2 were not creating ([9a22364](https://github.com/polonel/trudesk/commit/9a22364))
* **ticket:** fix [#116](https://github.com/polonel/trudesk/issues/116) - ability to configure character limit on tickets ([88ae488](https://github.com/polonel/trudesk/commit/88ae488))

## [1.0.4](https://github.com/polonel/trudesk/compare/v1.0.3...v1.0.4) (2019-01-03)


### Bug Fixes

* **appearance:** dark theme colors ([7ac11ad](https://github.com/polonel/trudesk/commit/7ac11ad))
* **attachments:** failed to upload on docker ([36a5bcb](https://github.com/polonel/trudesk/commit/36a5bcb))
* **crash:** idle users array out-of-bounds ([ebacda9](https://github.com/polonel/trudesk/commit/ebacda9))
* **mailer:** undefined value error ([b3658f1](https://github.com/polonel/trudesk/commit/b3658f1))


### Reverts

* **routes:** miscommit ([9198e47](https://github.com/polonel/trudesk/commit/9198e47))

## [1.0.3](https://github.com/polonel/trudesk/compare/v1.0.2...v1.0.3) (2018-12-03)


### Bug Fixes

* **accounts:** crash if user was deleted with active conversations [#109](https://github.com/polonel/trudesk/issues/109) ([6ea0ad4](https://github.com/polonel/trudesk/commit/6ea0ad4))
* **assets:** security fix ([b081965](https://github.com/polonel/trudesk/commit/b081965))
* **install:** server crash due to invalid middleware ([88367d9](https://github.com/polonel/trudesk/commit/88367d9))
* **mobile:** secure assets not loading ([dca823e](https://github.com/polonel/trudesk/commit/dca823e))
* **reports:** unable to download reports [#106](https://github.com/polonel/trudesk/issues/106) ([a2cdb7f](https://github.com/polonel/trudesk/commit/a2cdb7f))
* **sass:** not compiling for install server ([e0f744d](https://github.com/polonel/trudesk/commit/e0f744d))
* **static:** file access path ([568c343](https://github.com/polonel/trudesk/commit/568c343))
* **style:** disabled classes applied incorrectly ([884519c](https://github.com/polonel/trudesk/commit/884519c))
* **style:** incorrect border style ([5edfb0f](https://github.com/polonel/trudesk/commit/5edfb0f))
* **styles:** incorrect styles ([ae0d82f](https://github.com/polonel/trudesk/commit/ae0d82f))
* **tickettype:** crash when deleting ticket type [#113](https://github.com/polonel/trudesk/issues/113) ([dc4d335](https://github.com/polonel/trudesk/commit/dc4d335))


### Reverts

* **static:** files path var ([dd440e0](https://github.com/polonel/trudesk/commit/dd440e0))

## [1.0.2](https://github.com/polonel/trudesk/compare/v1.0.1...v1.0.2) (2018-11-03)


### Bug Fixes

* **assets:** security fix ([4f6c00d](https://github.com/polonel/trudesk/commit/4f6c00d))
* **database:** connection returning true even if error occured ([0156c4b](https://github.com/polonel/trudesk/commit/0156c4b))
* **database:** removed incorrect events ([357752d](https://github.com/polonel/trudesk/commit/357752d))
* **mobile:** chrome 53+ not allowing selects to open. [#96](https://github.com/polonel/trudesk/issues/96) ([7d71135](https://github.com/polonel/trudesk/commit/7d71135))
* **styles:** issue [#101](https://github.com/polonel/trudesk/issues/101) editing issue/comment/note ([46ab7e8](https://github.com/polonel/trudesk/commit/46ab7e8))
* **styles:** new tickets had incorrect classes ([4793c31](https://github.com/polonel/trudesk/commit/4793c31))
* **tickets:** public ticket crash [#103](https://github.com/polonel/trudesk/issues/103) ([19b75f1](https://github.com/polonel/trudesk/commit/19b75f1))
* **timezone:** option to set local timezone ([e3eb12a](https://github.com/polonel/trudesk/commit/e3eb12a))

## [1.0.1](https://github.com/polonel/trudesk/compare/v1.0.0...v1.0.1) (2018-09-27)


### Bug Fixes

* **package.json:** update version number on release ([229ab07](https://github.com/polonel/trudesk/commit/229ab07))

# 1.0.0 (2018-09-27)


### Bug Fixes

* package.json & .snyk to reduce vulnerabilities ([590ddef](https://github.com/polonel/trudesk/commit/590ddef))
* package.json & .snyk to reduce vulnerabilities ([0394893](https://github.com/polonel/trudesk/commit/0394893))
* package.json to reduce vulnerabilities ([42783e1](https://github.com/polonel/trudesk/commit/42783e1))
* package.json to reduce vulnerabilities ([4940ef1](https://github.com/polonel/trudesk/commit/4940ef1))
* **group:** undefined text when deleting group ([6f432db](https://github.com/polonel/trudesk/commit/6f432db))
* **mobile:** updated ([1ace577](https://github.com/polonel/trudesk/commit/1ace577))
* **settings:** tag display on no tags ([6929cc1](https://github.com/polonel/trudesk/commit/6929cc1))
* **test:** updated test for priority changes ([cdf0a4d](https://github.com/polonel/trudesk/commit/cdf0a4d))
* **user:** crash fix for undefined title ([5e2b38c](https://github.com/polonel/trudesk/commit/5e2b38c))

# Change Log

## [Unreleased](https://github.com/polonel/trudesk/tree/HEAD)

[Full Changelog](https://github.com/polonel/trudesk/compare/0.1.9...HEAD)

**Fixed bugs:**

- Cannot create a group in 1.8 [\#23](https://github.com/polonel/trudesk/issues/23)
- Crash in MailCheck [\#9](https://github.com/polonel/trudesk/issues/9)

**Closed issues:**

- Confirm Delete on Groups [\#16](https://github.com/polonel/trudesk/issues/16)

## [0.1.9](https://github.com/polonel/trudesk/tree/0.1.9) (2017-05-01)
[Full Changelog](https://github.com/polonel/trudesk/compare/0.1.8...0.1.9)

**Implemented enhancements:**

- 404 Errors getting dumped to log file [\#22](https://github.com/polonel/trudesk/issues/22)

**Fixed bugs:**

- 404 Errors getting dumped to log file [\#22](https://github.com/polonel/trudesk/issues/22)
- Able to delete your own account [\#21](https://github.com/polonel/trudesk/issues/21)
- Default Administrators Group can be deleted [\#20](https://github.com/polonel/trudesk/issues/20)
- Install Script for New Mongodb does not show restart [\#14](https://github.com/polonel/trudesk/issues/14)
- User role can edit/add tags on tickets [\#12](https://github.com/polonel/trudesk/issues/12)

## [0.1.8](https://github.com/polonel/trudesk/tree/0.1.8) (2017-03-07)
[Full Changelog](https://github.com/polonel/trudesk/compare/0.1.7...0.1.8)

**Fixed bugs:**

- \*UNSTABLE\* - Unable to run install script [\#17](https://github.com/polonel/trudesk/issues/17)

**Merged pull requests:**

- Bug Fixes for 0.1.8 [\#19](https://github.com/polonel/trudesk/pull/19) ([polonel](https://github.com/polonel))
- Release 0.1.8 Merge [\#18](https://github.com/polonel/trudesk/pull/18) ([polonel](https://github.com/polonel))

## [0.1.7](https://github.com/polonel/trudesk/tree/0.1.7) (2016-10-22)
[Full Changelog](https://github.com/polonel/trudesk/compare/0.1.6...0.1.7)

**Fixed bugs:**

- NiceScroll Disappears on AJAX page request [\#11](https://github.com/polonel/trudesk/issues/11)
- Ticket Issue & Comments are still editable after closed. [\#7](https://github.com/polonel/trudesk/issues/7)
- Users still receive email after account disabled [\#6](https://github.com/polonel/trudesk/issues/6)
- Delete / Disable account fires twice [\#5](https://github.com/polonel/trudesk/issues/5)
- Topbar dropdowns overlap icons when notice is active [\#3](https://github.com/polonel/trudesk/issues/3)
- Set Assignee Permissions are incorrect [\#2](https://github.com/polonel/trudesk/issues/2)
- Crash when fails to connect to mail server [\#1](https://github.com/polonel/trudesk/issues/1)

**Merged pull requests:**

- Develop Update [\#8](https://github.com/polonel/trudesk/pull/8) ([polonel](https://github.com/polonel))
- Develop to Master [\#4](https://github.com/polonel/trudesk/pull/4) ([polonel](https://github.com/polonel))

## [0.1.6](https://github.com/polonel/trudesk/tree/0.1.6) (2016-01-25)
[Full Changelog](https://github.com/polonel/trudesk/compare/0.1.5...0.1.6)

## [0.1.5](https://github.com/polonel/trudesk/tree/0.1.5) (2015-12-28)
[Full Changelog](https://github.com/polonel/trudesk/compare/0.1.4...0.1.5)

## [0.1.4](https://github.com/polonel/trudesk/tree/0.1.4) (2015-11-07)
[Full Changelog](https://github.com/polonel/trudesk/compare/0.1.3...0.1.4)

## [0.1.3](https://github.com/polonel/trudesk/tree/0.1.3) (2015-10-28)
[Full Changelog](https://github.com/polonel/trudesk/compare/0.1.2...0.1.3)

## [0.1.2](https://github.com/polonel/trudesk/tree/0.1.2) (2015-08-24)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*
