# 배전 가공 현장 LIVE (MVP)

한전 배전공사(가공) 시공관리책임자의 의사결정 딜레마(공정/민원/업체압박/작업통제/계통안정성)를
몰입형 UI로 체감하도록 만든 미니 시뮬레이션 게임입니다.

## 폴더 구성
- index.html
- style.css
- data.js
- app.js

## 앱에 붙이는 방법(간단)
### 1) 링크로 붙이기
앱(정적 웹앱) 폴더에 `kePCO_overhead_game` 폴더를 통째로 복사 후,
메뉴에서 `kePCO_overhead_game/index.html` 로 이동.

### 2) iframe으로 붙이기(가장 쉬움)
```html
<iframe
  src="kePCO_overhead_game/index.html"
  style="width:100%;height:100vh;border:0;"
></iframe>
```

### 3) 특정 공사 유형으로 바로 시작
- `kePCO_overhead_game/index.html?type=overhead_new`
- `kePCO_overhead_game/index.html?type=overhead_relocate_pole`
- `kePCO_overhead_game/index.html?type=overhead_replace_tr`
- `kePCO_overhead_game/index.html?type=overhead_replace_switch`

## 메모
- 중대재해는 교육용 강화 확률(누적 리스크 + 랜덤)로 발생합니다.
- 실제 작업은 관련 규정/절차/현장 위험성평가를 우선합니다.
