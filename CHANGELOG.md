# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

## Added

- ✨(ci) add security scan #291

## Changed

- 💄(frontend) error alert closeable on editor #284
- ♻️(backend) Change email content #283
- 💄(frontend) integrate new ui #286

## Fixed

- 🐛(backend) gitlab oicd userinfo endpoint #232
- 🛂(frontend) redirect to the OIDC when private doc and unauthentified #292
- ♻️(backend) getting list of document versions available for a user #258

## [1.4.0] - 2024-09-17

## Added

- ✨Add link public/authenticated/restricted access with read/editor roles #234
- ✨(frontend) add copy link button #235
- 🛂(frontend) access public docs without being logged #235

## Changed

- ♻️(backend) Allow null titles on documents for easier creation #234
- 🛂(backend) stop to list public doc to everyone #234
- 🚚(frontend) change visibility in share modal #235
- ⚡️(frontend) Improve summary #244

## Fixed

- 🐛(backend) Fix forcing ID when creating a document via API endpoint #234
- 🐛 Rebuild frontend dev container from makefile #248


## [1.3.0] - 2024-09-05

## Added

- ✨Add image attachments with access control
- ✨(frontend) Upload image to a document #211
- ✨(frontend) Summary #223
- ✨(frontend) update meta title for docs page #231

## Changed

- 💄(frontend) code background darkened on editor #214
- 🔥(frontend) hide markdown button if not text #213

## Fixed

- 🐛 Fix emoticon in pdf export #225
- 🐛 Fix collaboration on document #226
- 🐛 (docker) Fix compatibility with mac #230

## Removed

- 🔥(frontend) remove saving modal #213


## [1.2.1] - 2024-08-23

## Changed

- ♻️ Change ordering docs datagrid #195
- 🔥(helm) use scaleway email #194


## [1.2.0] - 2024-08-22

## Added

- 🎨(frontend) better conversion editor to pdf #151
- ✨Export docx (word) #161
- 🌐Internationalize invitation email #167
- ✨(frontend) White branding #164
- ✨Email invitation when add user to doc #171
- ✨Invitation management #174

## Fixed

- 🐛(y-webrtc) fix prob connection #147
- ⚡️(frontend) improve select share stability #159
- 🐛(backend) enable SSL when sending email #165

## Changed

- 🎨(frontend) stop limit layout height to screen size #158
- ⚡️(CI) only e2e chrome mandatory #177

## Removed
- 🔥(helm) remove htaccess #181


## [1.1.0] - 2024-07-15

## Added

- 🤡(demo) generate dummy documents on dev users #120 
- ✨(frontend) create side modal component #134
- ✨(frontend) Doc grid actions (update / delete) #136
- ✨(frontend) Doc editor header information #137

## Changed

- ♻️(frontend) replace docs panel with docs grid #120
- ♻️(frontend) create a doc from a modal #132
- ♻️(frontend) manage members from the share modal #140


## [1.0.0] - 2024-07-02

## Added

- 🛂(frontend) Manage the document's right (#75) 
- ✨(frontend) Update document (#68)
- ✨(frontend) Remove document (#68)
- 🐳(docker) dockerize dev frontend (#63)
- 👔(backend) list users with email filtering (#79)
- ✨(frontend) add user to a document (#52)
- ✨(frontend) invite user to a document (#52)
- 🛂(frontend) manage members (update role / list / remove) (#81)
- ✨(frontend) offline mode (#88)
- 🌐(frontend) translate cgu (#83)
- ✨(service-worker) offline doc management (#94)
- ⚗️(frontend) Add beta tag on logo (#121)

## Changed

- ♻️(frontend) Change site from Impress to Docs (#76)
- ✨(frontend) Generate PDF from a modal (#68)
- 🔧(helm) sticky session by request_uri for signaling server (#78)
- ♻️(frontend) change logo (#84)
- ♻️(frontend) pdf has title doc (#84)
- ⚡️(e2e) unique login between tests (#80)
- ⚡️(CI) improve e2e job (#86)
- ♻️(frontend) improve the error and message info ui (#93)
- ✏️(frontend) change all occurences of pad to doc (#99)

## Fixed

- 🐛(frontend) Fix the break line when generate PDF (#84)

## Delete

- 💚(CI) Remove trigger workflow on push tags on CI (#68)
- 🔥(frontend) Remove coming soon page (#121)


## [0.1.0] - 2024-05-24

## Added

- ✨(frontend) Coming Soon page (#67)
- 🚀 Impress, project to manage your documents easily and collaboratively.


[unreleased]: https://github.com/numerique-gouv/impress/compare/v1.4.0...main
[1.4.0]: https://github.com/numerique-gouv/impress/releases/v1.4.0
[1.3.0]: https://github.com/numerique-gouv/impress/releases/v1.3.0
[1.2.1]: https://github.com/numerique-gouv/impress/releases/v1.2.1
[1.2.0]: https://github.com/numerique-gouv/impress/releases/v1.2.0
[1.1.0]: https://github.com/numerique-gouv/impress/releases/v1.1.0
[1.0.0]: https://github.com/numerique-gouv/impress/releases/v1.0.0
[0.1.0]: https://github.com/numerique-gouv/impress/releases/v0.1.0
