# three.js 0.170.0 (로컬 번들)

`3d.html`(3D 운지 보기)에서만 사용합니다. 2D 앱(`index.html`)은 이 폴더를 불러오지 않습니다.

| 파일 | 원본 (npm `three@0.170.0`) | 변경 |
|---|---|---|
| `three.module.min.js` | `build/three.module.min.js` | 없음 (sha256 `08fd7545…c39e7`) |
| `addons/OrbitControls.js` | `examples/jsm/controls/OrbitControls.js` | `from 'three'` → `from '../three.module.min.js'` |
| `addons/RoomEnvironment.js` | `examples/jsm/environments/RoomEnvironment.js` | 같은 import 경로 재작성 |
| `addons/RoundedBoxGeometry.js` | `examples/jsm/geometries/RoundedBoxGeometry.js` | 같은 import 경로 재작성 |
| `LICENSE` | `LICENSE` (MIT) | 없음 |

## 왜 CDN이 아니라 로컬인가
- 설계서 규약(외부 CDN 금지)과 PWA 오프라인 동작을 지키기 위해 같은 출처에서 제공하고 서비스워커가 미리 캐시합니다.
- import 경로를 상대경로로 바꿔 두어 **import map이 필요 없습니다** (import map을 지원하지 않는 iOS 16.3 이하 Safari에서도 동작).

## 버전 올리는 법
1. `npm pack three@<버전>` 등으로 위 4개 파일을 새 폴더 `vendor/three-<버전>/`에 복사하고 addons의 `from 'three'`를 같은 방식으로 바꿉니다.
2. `3d.html`의 import 경로와 `sw.js`의 `APP_SHELL` 목록을 새 폴더로 바꾸고 `CACHE_VERSION`을 올립니다.
3. 이전 버전 폴더를 지웁니다. (폴더 이름에 버전이 들어 있어 캐시가 섞이지 않습니다)
