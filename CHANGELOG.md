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
