# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## Added

- 🎨(frontend) better conversion editor to pdf #151
- ✨(frontend) Versioning #147

## Fixed

- 🐛(y-webrtc) fix prob connection #147

## Changed

- 🎨(frontend) stop limit layout height to screen size #158

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


[unreleased]: https://github.com/numerique-gouv/impress/compare/v1.1.0...main
[1.1.0]: https://github.com/numerique-gouv/impress/releases/v1.1.0
[1.0.0]: https://github.com/numerique-gouv/impress/releases/v1.0.0
[0.1.0]: https://github.com/numerique-gouv/impress/releases/v0.1.0