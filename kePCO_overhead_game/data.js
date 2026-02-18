/* Scenario data for KEPCO Overhead Distribution (배전 가공)
   - 4 project types
   - each has 7 steps (짧은 현장 시뮬레이션)
   - choices adjust metrics & add flags/multipliers
*/
const GAME_DATA = {
  meta: {
    version: "1.0.0-mvp",
    mode: "교육용 강화",
    stepsPerRun: 7,
  },
  projects: {
    overhead_new: {
      id: "overhead_new",
      title: "⚡ 배전 가공 · 신규공사",
      meta: "신설 전주/가공선로 신설 · 민원(통행/소음) + 낙하/추락 + 근접 위험",
      init: { hazard: 55, compliance: 62, progress: 0, complaint: 45, boss: 42, crew: 60, grid: 82, negligence: 0 },
      steps: [
        {
          title: "착수: 교통 통제 & 작업구역 설정",
          desc: "굴착/장비 진입 준비 중. 도로 가장자리 정차 차량 때문에 장비 동선이 꼬입니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "차 좀 빼라는데요? 출근길 막히면 가만 안 둡니다." },
            { who: "작업반장", type: "crew", msg: "차가 안 빠지면 고소차 위치가 애매합니다. 그냥 각도 좀 틀어서 할까요?" }
          ],
          timer: false,
          choices: [
            {
              text: "교통통제 강화 + 안내요원 배치(차량 이동 유도) 후 안전 동선 확보",
              tags: ["교통통제", "동선확보", "안전우선"],
              effects: { hazard: -6, compliance: +8, progress: +8, complaint: -6, boss: +2, crew: +3, grid: 0, negligence: -2 },
              riskMult: 0.92
            },
            {
              text: "최소 통제만 하고 장비 위치를 '대충' 조정해서 진행(시간 단축)",
              tags: ["시간단축", "절충"],
              effects: { hazard: +6, compliance: -6, progress: +14, complaint: +4, boss: -2, crew: -3, grid: 0, negligence: +6 },
              riskMult: 1.10
            },
            {
              text: "차량 이동 불가 구역은 작업 제외하고 다른 구간부터 착수(작업 분할)",
              tags: ["작업분할", "현장통제"],
              effects: { hazard: -2, compliance: +4, progress: +10, complaint: -2, boss: +1, crew: +1, grid: 0, negligence: +1 },
              riskMult: 0.98
            }
          ]
        },
        {
          title: "TBM: 위험요인 공유(형식 vs 실질)",
          desc: "신규 현장. 신입 1명이 합류했습니다. TBM을 빨리 끝내자는 분위기입니다.",
          bubbles: [
            { who: "업체 사장", type: "boss", msg: "오늘은 공정 좀 뽑아야 해요. TBM은 짧게 하고 들어갑시다." },
            { who: "신입 작업자", type: "crew", msg: "근접거리 기준이… 몇 m였죠?" }
          ],
          timer: true,
          choices: [
            {
              text: "TBM 재실시(근접거리·낙하·추락·차폐) + 신입 역할 고정(감시 포함)",
              tags: ["TBM", "신입통제", "근접거리"],
              effects: { hazard: -8, compliance: +10, progress: +8, complaint: +1, boss: +4, crew: +5, grid: 0, negligence: -3 },
              riskMult: 0.88
            },
            {
              text: "TBM은 서명만 받고 바로 투입(형식적)",
              tags: ["서명만", "속도우선", "위험"],
              effects: { hazard: +7, compliance: -10, progress: +14, complaint: 0, boss: -4, crew: -6, grid: 0, negligence: +10 },
              riskMult: 1.18
            },
            {
              text: "핵심 3가지만 빠르게 공유(근접·추락·절연)하고 즉시 투입(절충)",
              tags: ["핵심만", "절충"],
              effects: { hazard: +2, compliance: -2, progress: +12, complaint: 0, boss: -2, crew: -1, grid: 0, negligence: +4 },
              riskMult: 1.05
            }
          ]
        },
        {
          title: "고소작업: 추락 방지 vs 속도",
          desc: "전주 상부 작업. 안전벨트 연결점 확보가 번거롭습니다.",
          bubbles: [
            { who: "작업자", type: "crew", msg: "벨트 걸면 움직임이 너무 제한돼요. 금방 끝낼 건데…" },
            { who: "민원인", type: "complaint", msg: "언제 끝나요? 소음 때문에 장사 못하겠어요." }
          ],
          timer: true,
          choices: [
            {
              text: "추락방지 재확인(연결점·2중고리) + 작업순서 재조정",
              tags: ["추락방지", "작업순서", "안전우선"],
              effects: { hazard: -7, compliance: +8, progress: +10, complaint: +2, boss: +2, crew: +2, grid: 0, negligence: -2 },
              riskMult: 0.92
            },
            {
              text: "안전벨트는 '대충' 착용하고 빠르게 진행(강행)",
              tags: ["강행", "절차생략", "위험"],
              effects: { hazard: +10, compliance: -8, progress: +16, complaint: -2, boss: -4, crew: -5, grid: 0, negligence: +9 },
              riskMult: 1.22
            },
            {
              text: "저위험 구간만 먼저 처리하고 상부 작업은 잠시 보류(민원 응대 후 재개)",
              tags: ["분리작업", "민원응대"],
              effects: { hazard: -1, compliance: +3, progress: +8, complaint: -6, boss: +3, crew: +1, grid: 0, negligence: +2 },
              riskMult: 0.98
            }
          ]
        },
        {
          title: "근접 작업: 차폐·절연공구 점검",
          desc: "인접 활선 구간이 있습니다. 차폐 설치 시간이 걸립니다.",
          bubbles: [
            { who: "업체 사장", type: "boss", msg: "차폐까지 하면 시간이 두 배입니다. 그냥 조심해서 하세요." },
            { who: "작업반장", type: "crew", msg: "절연장갑이 낡았는데… 괜찮겠죠?" }
          ],
          timer: true,
          choices: [
            {
              text: "차폐 설치 + 절연보호구/공구 전수 점검(불량 즉시 교체)",
              tags: ["차폐", "절연점검", "활선통제"],
              effects: { hazard: -10, compliance: +9, progress: +10, complaint: +3, boss: +5, crew: +3, grid: +1, negligence: -4 },
              riskMult: 0.85
            },
            {
              text: "차폐는 생략하고 '주의'만 주고 진행(무정전 강행)",
              tags: ["무정전강행", "차폐생략", "위험"],
              effects: { hazard: +12, compliance: -10, progress: +18, complaint: -4, boss: -6, crew: -6, grid: -6, negligence: +12 },
              riskMult: 1.30
            },
            {
              text: "최소 차폐만 하고 핵심 구간만 절연 강화(절충)",
              tags: ["부분차폐", "절충"],
              effects: { hazard: +4, compliance: -3, progress: +14, complaint: -2, boss: -3, crew: -2, grid: -2, negligence: +6 },
              riskMult: 1.10
            }
          ]
        },
        {
          title: "돌발: 장비 동선 재차 방해(차량 이동 불가)",
          desc: "현장 앞 차량이 끝내 이동을 거부합니다. 고소차 회전 반경이 부족합니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "여기가 내 자리예요. 못 빼요." },
            { who: "작업자", type: "crew", msg: "그럼 인력으로 끌고라도… 빨리 끝냅시다." }
          ],
          timer: true,
          choices: [
            {
              text: "안전한 대체 작업 위치 확보(교통 협조) 후 재배치(지연 감수)",
              tags: ["재배치", "통제강화", "안전우선"],
              effects: { hazard: -4, compliance: +6, progress: +8, complaint: +2, boss: +5, crew: +2, grid: 0, negligence: -1 },
              riskMult: 0.95
            },
            {
              text: "회전 반경 부족 상태로 강행(아슬아슬하게 통과)",
              tags: ["강행", "위험"],
              effects: { hazard: +9, compliance: -6, progress: +14, complaint: -3, boss: -4, crew: -4, grid: -3, negligence: +8 },
              riskMult: 1.20
            },
            {
              text: "작업 분할 + 차량 이동 설득(민원응대)으로 단계 진행",
              tags: ["분할", "민원응대"],
              effects: { hazard: -1, compliance: +3, progress: +10, complaint: -6, boss: +2, crew: +1, grid: 0, negligence: +2 },
              riskMult: 1.00
            }
          ]
        },
        {
          title: "마무리: 검측/정리 & 계통 영향 확인",
          desc: "마무리 단계. 정리정돈과 최종 점검이 귀찮아지는 시점입니다.",
          bubbles: [
            { who: "업체 사장", type: "boss", msg: "이제 거의 끝났죠? 바로 철수합시다." },
            { who: "작업반장", type: "crew", msg: "정리하면 시간이… 그냥 가도 되지 않나요?" }
          ],
          timer: false,
          choices: [
            {
              text: "정리정돈 + 최종 점검(절연·체결·표지) + 작업허가서 종료 처리",
              tags: ["최종점검", "정리정돈", "완료관리"],
              effects: { hazard: -6, compliance: +7, progress: +16, complaint: 0, boss: +2, crew: +2, grid: +2, negligence: -3 },
              riskMult: 0.92
            },
            {
              text: "대충 정리하고 철수(완료보고 먼저)",
              tags: ["서류우선", "생략", "위험"],
              effects: { hazard: +5, compliance: -6, progress: +20, complaint: 0, boss: -3, crew: -2, grid: -4, negligence: +7 },
              riskMult: 1.12
            },
            {
              text: "핵심만 점검하고 즉시 철수(절충)",
              tags: ["핵심점검", "절충"],
              effects: { hazard: +1, compliance: -2, progress: +18, complaint: 0, boss: -2, crew: 0, grid: 0, negligence: +3 },
              riskMult: 1.04
            }
          ]
        },
        {
          title: "완료: 인수인계 & 민원 종료",
          desc: "현장 종료 전 마지막으로 인수인계와 민원 종료 안내가 남았습니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "다시는 이런 공사 하지 마세요. 안내가 너무 부족했어요." },
            { who: "작업반장", type: "crew", msg: "마무리만 하면 끝입니다." }
          ],
          timer: false,
          choices: [
            {
              text: "인수인계(표지/접지/체결) + 민원 안내문/설명 후 종료",
              tags: ["인수인계", "민원관리", "완료"],
              effects: { hazard: -3, compliance: +5, progress: +20, complaint: -8, boss: +1, crew: +1, grid: +1, negligence: -2 },
              riskMult: 0.95
            },
            {
              text: "민원 안내 없이 즉시 종료(차후 대응)",
              tags: ["종료강행", "위험"],
              effects: { hazard: +2, compliance: -3, progress: +22, complaint: +6, boss: -1, crew: 0, grid: 0, negligence: +4 },
              riskMult: 1.05
            }
          ]
        }
      ]
    },

    overhead_relocate_pole: {
      id: "overhead_relocate_pole",
      title: "⚡ 배전 가공 · 지장전주 이설공사",
      meta: "협소공간/교통 민원 + 임시지지 + 근접/낙하 위험",
      init: { hazard: 60, compliance: 58, progress: 0, complaint: 55, boss: 55, crew: 58, grid: 78, negligence: 0 },
      steps: [
        {
          title: "착수: 도로 한복판 '지장' 전주",
          desc: "차로 한복판에 전주가 있어 이설이 필요합니다. 차도 통행 민원이 즉시 발생합니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "출근길인데 차 막히면 보상해요?" },
            { who: "업체 사장", type: "boss", msg: "이설은 시간이 돈입니다. 빨리 이동시켜요." }
          ],
          timer: true,
          choices: [
            {
              text: "차로 부분 통제 + 안전펜스 확대 + 유도원 2명 배치",
              tags: ["교통통제", "펜스", "안전우선"],
              effects: { hazard: -6, compliance: +8, progress: +10, complaint: -4, boss: +3, crew: +2, grid: 0, negligence: -2 },
              riskMult: 0.92
            },
            {
              text: "최소 통제로 통행을 최대한 살리고 작업 강행(민원 감소 기대)",
              tags: ["속도우선", "위험"],
              effects: { hazard: +8, compliance: -7, progress: +16, complaint: -2, boss: -4, crew: -3, grid: -2, negligence: +8 },
              riskMult: 1.18
            },
            {
              text: "우회 안내 강화 + 민원 설명 후 통제 범위 확보(절충)",
              tags: ["민원응대", "절충"],
              effects: { hazard: -2, compliance: +4, progress: +12, complaint: -6, boss: +2, crew: +1, grid: 0, negligence: +1 },
              riskMult: 0.98
            }
          ]
        },
        {
          title: "임시 지지: 장력/지지 구조 확보",
          desc: "이설 과정에서 임시 지지 구조가 핵심입니다. ‘대충’ 하면 낙하가 발생할 수 있습니다.",
          bubbles: [
            { who: "작업반장", type: "crew", msg: "임시 지지는 손이 많이 가요. 그냥 빠르게 걸어둘까요?" },
            { who: "업체 사장", type: "boss", msg: "지지 장비 추가하면 돈 더 듭니다." }
          ],
          timer: true,
          choices: [
            {
              text: "임시 지지 구조를 기준대로 설치(장력·체결·2중확인)",
              tags: ["임시지지", "2중확인", "안전우선"],
              effects: { hazard: -10, compliance: +10, progress: +10, complaint: +2, boss: +6, crew: +3, grid: +1, negligence: -4 },
              riskMult: 0.85
            },
            {
              text: "임시 지지는 최소로 하고 빠르게 이설(강행)",
              tags: ["절차생략", "강행", "위험"],
              effects: { hazard: +12, compliance: -10, progress: +18, complaint: -2, boss: -5, crew: -5, grid: -6, negligence: +12 },
              riskMult: 1.30
            },
            {
              text: "핵심 지점만 보강하고 나머지는 작업자 경험에 맡김(절충)",
              tags: ["부분보강", "절충"],
              effects: { hazard: +4, compliance: -3, progress: +14, complaint: 0, boss: -2, crew: -2, grid: -2, negligence: +6 },
              riskMult: 1.10
            }
          ]
        },
        {
          title: "근접: 인접 선로 차폐",
          desc: "인접 선로와 근접합니다. 차폐 시간 때문에 민원이 커집니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "언제 도로 열어요? 경찰 부를까요?" },
            { who: "작업자", type: "crew", msg: "차폐 설치하면 통행 더 막혀요." }
          ],
          timer: true,
          choices: [
            {
              text: "차폐 설치 후 단계 작업(통제 유지) — 민원은 즉시 안내",
              tags: ["차폐", "단계작업", "민원응대"],
              effects: { hazard: -8, compliance: +7, progress: +12, complaint: +3, boss: +3, crew: +2, grid: +1, negligence: -2 },
              riskMult: 0.90
            },
            {
              text: "차폐 생략하고 ‘주의’만 주고 진행(무정전 강행)",
              tags: ["무정전강행", "차폐생략", "위험"],
              effects: { hazard: +10, compliance: -9, progress: +18, complaint: -2, boss: -5, crew: -4, grid: -5, negligence: +10 },
              riskMult: 1.25
            },
            {
              text: "부분 차폐 + 통행 시간대에 맞춰 작업 분할(절충)",
              tags: ["부분차폐", "작업분할", "절충"],
              effects: { hazard: +3, compliance: -2, progress: +14, complaint: -4, boss: -2, crew: -1, grid: -1, negligence: +4 },
              riskMult: 1.08
            }
          ]
        },
        {
          title: "돌발: 신입 일용원 지시 불이행",
          desc: "신입 일용원이 ‘그건 내 일이 아니다’라며 감시 역할을 거부합니다.",
          bubbles: [
            { who: "신입 일용원", type: "crew", msg: "저는 운전만 하기로 했는데요? 감시는 못 합니다." },
            { who: "작업반장", type: "crew", msg: "감시 없으면 위험합니다. 책임자 판단 필요합니다." }
          ],
          timer: true,
          choices: [
            {
              text: "역할 재배치(감시 전담 지정) + 작업자 설득/교육 후 진행",
              tags: ["통제강화", "역할고정", "교육"],
              effects: { hazard: -6, compliance: +8, progress: +10, complaint: 0, boss: +3, crew: +6, grid: 0, negligence: -2 },
              riskMult: 0.92
            },
            {
              text: "그냥 진행(감시는 '대충' 서로 보면서) — 시간 우선",
              tags: ["강행", "위험"],
              effects: { hazard: +8, compliance: -8, progress: +16, complaint: 0, boss: -3, crew: -6, grid: -2, negligence: +8 },
              riskMult: 1.18
            },
            {
              text: "일용원 교체 요청 + 작업 분할(지연 감수)",
              tags: ["인원교체", "작업분할"],
              effects: { hazard: -3, compliance: +5, progress: +10, complaint: +2, boss: +4, crew: +2, grid: 0, negligence: +1 },
              riskMult: 0.98
            }
          ]
        },
        {
          title: "이설 본작업: 인양/설치",
          desc: "중량물 인양과 설치. 낙하·협착 리스크가 큽니다.",
          bubbles: [
            { who: "업체 사장", type: "boss", msg: "인양 한 번에 끝냅시다. 추가 신호수는 사치예요." },
            { who: "작업자", type: "crew", msg: "신호수 없으면 위험합니다." }
          ],
          timer: true,
          choices: [
            {
              text: "신호수 배치 + 인양구간 통제 + 인양 전 점검(훅/슬링/체결)",
              tags: ["인양점검", "신호수", "통제"],
              effects: { hazard: -9, compliance: +8, progress: +14, complaint: +1, boss: +4, crew: +3, grid: 0, negligence: -3 },
              riskMult: 0.88
            },
            {
              text: "신호수 없이 작업자 경험으로 인양(강행)",
              tags: ["강행", "위험"],
              effects: { hazard: +12, compliance: -9, progress: +20, complaint: -2, boss: -5, crew: -5, grid: -2, negligence: +10 },
              riskMult: 1.28
            },
            {
              text: "인양은 안전하게 하되 통제 범위를 줄여 민원 최소화(절충)",
              tags: ["통제축소", "절충"],
              effects: { hazard: +5, compliance: -4, progress: +18, complaint: -4, boss: -2, crew: -2, grid: -1, negligence: +6 },
              riskMult: 1.12
            }
          ]
        },
        {
          title: "마무리: 도로 개방 압박",
          desc: "정리정돈을 해야 하지만 민원과 사장 압박이 최고조입니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "지금 당장 도로 열어요!" },
            { who: "업체 사장", type: "boss", msg: "정리는 나중에. 철수!" }
          ],
          timer: true,
          choices: [
            {
              text: "정리정돈 + 표지 회수 + 최종 점검 후 도로 개방(원칙)",
              tags: ["정리정돈", "최종점검", "원칙"],
              effects: { hazard: -6, compliance: +7, progress: +16, complaint: -2, boss: +2, crew: +2, grid: +1, negligence: -2 },
              riskMult: 0.92
            },
            {
              text: "대충 정리하고 즉시 개방(강행)",
              tags: ["강행", "위험"],
              effects: { hazard: +6, compliance: -7, progress: +20, complaint: -6, boss: -3, crew: -2, grid: -3, negligence: +7 },
              riskMult: 1.15
            }
          ]
        },
        {
          title: "완료: 인수인계",
          desc: "인수인계 및 기록. 다음 팀이 볼 수 있게 정리해야 합니다.",
          bubbles: [
            { who: "작업반장", type: "crew", msg: "보고서만 쓰면 되죠? 현장 사진은 굳이…" },
            { who: "시스템", type: "system", msg: "인수인계 누락은 재발 사고의 씨앗입니다." }
          ],
          timer: false,
          choices: [
            {
              text: "인수인계(사진/표지/체결/임시지지 해체)까지 완료",
              tags: ["인수인계", "재발방지", "완료"],
              effects: { hazard: -4, compliance: +6, progress: +20, complaint: -3, boss: +1, crew: +1, grid: +1, negligence: -2 },
              riskMult: 0.95
            },
            {
              text: "기록 최소화 후 종료(서류만)",
              tags: ["서류만", "위험"],
              effects: { hazard: +3, compliance: -4, progress: +22, complaint: 0, boss: -1, crew: -1, grid: -1, negligence: +4 },
              riskMult: 1.06
            }
          ]
        }
      ]
    },

    overhead_replace_tr: {
      id: "overhead_replace_tr",
      title: "⚡ 배전 가공 · 노후 변압기 교체공사",
      meta: "중량물 인양 + 잔류전하/역전류 + 정전 민원 딜레마",
      init: { hazard: 62, compliance: 56, progress: 0, complaint: 60, boss: 58, crew: 56, grid: 74, negligence: 0 },
      steps: [
        {
          title: "사전: 정전 전환 협의 vs 무정전 강행",
          desc: "노후 변압기 교체. 정전 전환하면 민원 폭증, 무정전은 위험 증가.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "정전하면 장사 망합니다. 절대 안 돼요." },
            { who: "업체 사장", type: "boss", msg: "무정전으로 가면 공정도 살고 민원도 줄죠?" }
          ],
          timer: true,
          choices: [
            {
              text: "정전 전환(최소 시간) + 사전 안내/협조 + 대체전원 안내",
              tags: ["정전전환", "민원관리", "원칙"],
              effects: { hazard: -8, compliance: +8, progress: +12, complaint: +8, boss: +3, crew: +2, grid: +3, negligence: -2 },
              riskMult: 0.90
            },
            {
              text: "무정전 강행(절차 단축)으로 민원 최소화",
              tags: ["무정전강행", "위험"],
              effects: { hazard: +10, compliance: -8, progress: +18, complaint: -8, boss: -6, crew: -4, grid: -6, negligence: +10 },
              riskMult: 1.28
            },
            {
              text: "정전 구간을 분리(부분 정전) + 핵심 고객 우선 안내(절충)",
              tags: ["부분정전", "절충"],
              effects: { hazard: +2, compliance: +1, progress: +14, complaint: +2, boss: -2, crew: +1, grid: +1, negligence: +2 },
              riskMult: 1.05
            }
          ]
        },
        {
          title: "TBM: 잔류전하/역전류 공유",
          desc: "2차측 역전류 가능성, 잔류전하, 접지/방전 절차가 핵심입니다.",
          bubbles: [
            { who: "작업자", type: "crew", msg: "접지랑 방전 절차는… 오늘은 빨리 가죠?" },
            { who: "시스템", type: "system", msg: "변압기 교체는 ‘대충’이 허용되지 않습니다." }
          ],
          timer: true,
          choices: [
            {
              text: "방전/접지 절차를 체크리스트로 확인 + 역할 분담",
              tags: ["체크리스트", "접지/방전", "통제"],
              effects: { hazard: -9, compliance: +10, progress: +10, complaint: 0, boss: +3, crew: +4, grid: +2, negligence: -3 },
              riskMult: 0.88
            },
            {
              text: "서명만 받고 바로 투입(형식)",
              tags: ["서명만", "위험"],
              effects: { hazard: +8, compliance: -9, progress: +16, complaint: 0, boss: -3, crew: -5, grid: -3, negligence: +9 },
              riskMult: 1.20
            }
          ]
        },
        {
          title: "인양 준비: 신호수/통제",
          desc: "변압기 인양. 신호수 배치와 통제 범위가 작업 속도와 충돌합니다.",
          bubbles: [
            { who: "업체 사장", type: "boss", msg: "신호수 추가는 비용입니다. 한 번에 올려요." },
            { who: "작업반장", type: "crew", msg: "통제 없으면 낙하/협착 위험이 큽니다." }
          ],
          timer: true,
          choices: [
            {
              text: "신호수 배치 + 통제 범위 확대 + 인양구 점검(훅/슬링/체결)",
              tags: ["신호수", "통제", "인양점검"],
              effects: { hazard: -10, compliance: +9, progress: +12, complaint: +2, boss: +5, crew: +3, grid: 0, negligence: -3 },
              riskMult: 0.86
            },
            {
              text: "통제 최소로 하고 빠르게 인양(강행)",
              tags: ["강행", "위험"],
              effects: { hazard: +12, compliance: -8, progress: +20, complaint: -2, boss: -5, crew: -4, grid: -2, negligence: +9 },
              riskMult: 1.25
            },
            {
              text: "인양은 안전하게, 통제는 최소(절충)",
              tags: ["절충", "통제축소"],
              effects: { hazard: +5, compliance: -4, progress: +16, complaint: -2, boss: -2, crew: -2, grid: 0, negligence: +6 },
              riskMult: 1.12
            }
          ]
        },
        {
          title: "연결: 체결·절연·차폐",
          desc: "체결 토크, 절연 상태, 차폐 확인이 필요합니다. 하지만 민원과 압박이 큽니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "언제 전기 들어와요? 냉장고 다 녹습니다." },
            { who: "작업자", type: "crew", msg: "체결 토크 측정은 생략해도…?" }
          ],
          timer: true,
          choices: [
            {
              text: "체결/절연/차폐를 기준대로 점검 후 투입(원칙)",
              tags: ["체결토크", "절연점검", "원칙"],
              effects: { hazard: -8, compliance: +8, progress: +12, complaint: +2, boss: +3, crew: +2, grid: +2, negligence: -2 },
              riskMult: 0.90
            },
            {
              text: "시간 없으니 일부 점검 생략하고 투입(강행)",
              tags: ["생략", "위험"],
              effects: { hazard: +10, compliance: -8, progress: +18, complaint: -3, boss: -4, crew: -3, grid: -6, negligence: +9 },
              riskMult: 1.22
            }
          ]
        },
        {
          title: "돌발: 보호계전 오동작 조짐",
          desc: "계통이 불안정합니다. 조작/투입 타이밍이 중요합니다.",
          bubbles: [
            { who: "시스템", type: "system", msg: "계통안정성 저하: 보호계전 경보." },
            { who: "업체 사장", type: "boss", msg: "그냥 넣고 끝내요. 민원 감당 못 합니다." }
          ],
          timer: true,
          choices: [
            {
              text: "투입 보류 + 계통 확인/협의 후 단계 투입(안정성 우선)",
              tags: ["계통확인", "보류", "안전우선"],
              effects: { hazard: -4, compliance: +6, progress: +10, complaint: +4, boss: +4, crew: +2, grid: +10, negligence: -1 },
              riskMult: 0.95
            },
            {
              text: "경보 무시하고 즉시 투입(강행)",
              tags: ["강행", "위험"],
              effects: { hazard: +6, compliance: -6, progress: +16, complaint: -2, boss: -4, crew: -3, grid: -12, negligence: +7 },
              riskMult: 1.18
            }
          ]
        },
        {
          title: "마무리: 민원 종료 & 현장 정리",
          desc: "전기 투입 후 민원과 정리정돈이 남았습니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "다시는 이런 일 없게 해주세요." },
            { who: "작업자", type: "crew", msg: "정리하면 퇴근 늦어져요…" }
          ],
          timer: false,
          choices: [
            {
              text: "정리정돈 + 민원 안내 + 재발방지 체크(원칙)",
              tags: ["정리정돈", "민원관리", "재발방지"],
              effects: { hazard: -5, compliance: +7, progress: +18, complaint: -8, boss: +1, crew: +2, grid: +2, negligence: -2 },
              riskMult: 0.92
            },
            {
              text: "빠르게 철수(민원은 콜센터로)",
              tags: ["철수", "위험"],
              effects: { hazard: +3, compliance: -4, progress: +22, complaint: +4, boss: -1, crew: 0, grid: 0, negligence: +4 },
              riskMult: 1.05
            }
          ]
        },
        {
          title: "완료: 인수인계",
          desc: "마지막 인수인계 단계.",
          bubbles: [
            { who: "시스템", type: "system", msg: "인수인계 누락은 다음 사고로 이어집니다." }
          ],
          timer: false,
          choices: [
            {
              text: "인수인계 및 기록 완료(사진/체결/경보 이력)",
              tags: ["인수인계", "완료"],
              effects: { hazard: -3, compliance: +5, progress: +20, complaint: -2, boss: 0, crew: +1, grid: +2, negligence: -1 },
              riskMult: 0.96
            },
            {
              text: "기록 최소화 후 종료",
              tags: ["서류만", "위험"],
              effects: { hazard: +2, compliance: -3, progress: +22, complaint: 0, boss: 0, crew: -1, grid: -2, negligence: +3 },
              riskMult: 1.06
            }
          ]
        }
      ]
    },

    overhead_replace_switch: {
      id: "overhead_replace_switch",
      title: "⚡ 배전 가공 · 불량 개폐기 교체공사",
      meta: "개폐기 오동작/아크 + 무정전 유혹 + 정전 민원",
      init: { hazard: 58, compliance: 60, progress: 0, complaint: 58, boss: 52, crew: 60, grid: 76, negligence: 0 },
      steps: [
        {
          title: "착수: 정전 안내 vs 민원 폭발",
          desc: "불량 개폐기 교체. 정전을 최소화하려고 무정전 유혹이 큽니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "정전하면 컴퓨터 다 날아가요!" },
            { who: "업체 사장", type: "boss", msg: "무정전으로 하면 민원도 줄고 돈도 절약됩니다." }
          ],
          timer: true,
          choices: [
            {
              text: "정전 최소 시간 계획 + 사전 안내(상가/취약고객 우선) 후 진행",
              tags: ["정전계획", "민원관리", "원칙"],
              effects: { hazard: -6, compliance: +7, progress: +12, complaint: +6, boss: +3, crew: +2, grid: +3, negligence: -2 },
              riskMult: 0.92
            },
            {
              text: "무정전 강행(절차 단축)으로 진행",
              tags: ["무정전강행", "위험"],
              effects: { hazard: +9, compliance: -8, progress: +18, complaint: -6, boss: -5, crew: -3, grid: -6, negligence: +9 },
              riskMult: 1.25
            },
            {
              text: "부분 정전 + 단계 작업(절충)",
              tags: ["부분정전", "절충"],
              effects: { hazard: +2, compliance: +1, progress: +14, complaint: +2, boss: -2, crew: +1, grid: +1, negligence: +2 },
              riskMult: 1.05
            }
          ]
        },
        {
          title: "TBM: 아크 위험 & 투입 절차",
          desc: "개폐기 교체는 아크/오동작 위험이 있습니다. 투입 절차 공유가 중요합니다.",
          bubbles: [
            { who: "작업자", type: "crew", msg: "아크는 장갑만 끼면 괜찮죠?" },
            { who: "시스템", type: "system", msg: "아크는 보호구 + 절차 + 거리 통제가 핵심입니다." }
          ],
          timer: true,
          choices: [
            {
              text: "TBM 실질 진행(아크·거리·절차) + 보호구 재점검",
              tags: ["TBM", "아크대비", "보호구"],
              effects: { hazard: -7, compliance: +9, progress: +10, complaint: 0, boss: +2, crew: +4, grid: +1, negligence: -3 },
              riskMult: 0.90
            },
            {
              text: "서명만 받고 작업 시작(형식)",
              tags: ["서명만", "위험"],
              effects: { hazard: +7, compliance: -9, progress: +16, complaint: 0, boss: -2, crew: -4, grid: -3, negligence: +9 },
              riskMult: 1.18
            }
          ]
        },
        {
          title: "근접: 차폐 설치",
          desc: "인접 활선 구간 차폐. 민원 압박으로 시간을 줄이려 합니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "정전 오래 걸리면 손해배상 청구합니다." },
            { who: "업체 사장", type: "boss", msg: "차폐는 과합니다. 빨리 바꾸고 넣죠." }
          ],
          timer: true,
          choices: [
            {
              text: "차폐 + 절연공구 점검 + 통제 범위 확보(원칙)",
              tags: ["차폐", "절연점검", "통제"],
              effects: { hazard: -9, compliance: +8, progress: +12, complaint: +2, boss: +5, crew: +2, grid: +2, negligence: -3 },
              riskMult: 0.88
            },
            {
              text: "차폐 생략(무정전 강행)으로 교체",
              tags: ["차폐생략", "무정전강행", "위험"],
              effects: { hazard: +12, compliance: -10, progress: +20, complaint: -4, boss: -6, crew: -5, grid: -8, negligence: +12 },
              riskMult: 1.32
            }
          ]
        },
        {
          title: "돌발: 작업자 불만 폭발(야근/수당)",
          desc: "작업자들이 수당/야근 문제로 통제가 흔들립니다.",
          bubbles: [
            { who: "작업자", type: "crew", msg: "이 조건이면 더 못 합니다. 그냥 대충 끝내죠." },
            { who: "작업반장", type: "crew", msg: "통제가 깨지면 사고 납니다." }
          ],
          timer: true,
          choices: [
            {
              text: "작업 중지 후 조건 조율(통제 회복) + 역할 재정렬",
              tags: ["통제회복", "조율", "안전우선"],
              effects: { hazard: -5, compliance: +7, progress: +8, complaint: +3, boss: +4, crew: +8, grid: 0, negligence: -2 },
              riskMult: 0.95
            },
            {
              text: "그냥 밀어붙임(통제 약화 상태로 진행)",
              tags: ["강행", "위험"],
              effects: { hazard: +7, compliance: -7, progress: +16, complaint: 0, boss: -3, crew: -8, grid: -2, negligence: +7 },
              riskMult: 1.18
            },
            {
              text: "핵심 인원만 남겨 진행(단독작업 성향 증가)",
              tags: ["인원축소", "절충", "위험"],
              effects: { hazard: +6, compliance: -5, progress: +14, complaint: 0, boss: -2, crew: -6, grid: -2, negligence: +6 },
              riskMult: 1.15
            }
          ]
        },
        {
          title: "교체: 투입/개폐 절차",
          desc: "투입 타이밍과 절차 준수 여부가 사고를 가릅니다.",
          bubbles: [
            { who: "시스템", type: "system", msg: "계통안정성 변동: 단계 투입 권장." }
          ],
          timer: true,
          choices: [
            {
              text: "단계 투입 + 확인 절차(원칙)",
              tags: ["단계투입", "확인절차", "원칙"],
              effects: { hazard: -6, compliance: +7, progress: +14, complaint: +2, boss: +2, crew: +2, grid: +6, negligence: -2 },
              riskMult: 0.92
            },
            {
              text: "한 번에 투입(강행)",
              tags: ["강행", "위험"],
              effects: { hazard: +8, compliance: -7, progress: +20, complaint: -2, boss: -3, crew: -3, grid: -10, negligence: +8 },
              riskMult: 1.20
            }
          ]
        },
        {
          title: "마무리: 민원 종료 안내",
          desc: "민원 대응과 정리정돈이 남았습니다.",
          bubbles: [
            { who: "민원인", type: "complaint", msg: "왜 이렇게 오래 걸려요? 공지라도 하세요." }
          ],
          timer: false,
          choices: [
            {
              text: "민원 안내 + 정리정돈 + 최종 점검",
              tags: ["민원관리", "정리정돈", "점검"],
              effects: { hazard: -4, compliance: +6, progress: +18, complaint: -8, boss: +1, crew: +2, grid: +2, negligence: -2 },
              riskMult: 0.95
            },
            {
              text: "바로 철수(민원은 나중에)",
              tags: ["철수", "위험"],
              effects: { hazard: +2, compliance: -3, progress: +22, complaint: +6, boss: 0, crew: 0, grid: -2, negligence: +4 },
              riskMult: 1.06
            }
          ]
        },
        {
          title: "완료: 기록/인수인계",
          desc: "마지막 기록 단계.",
          bubbles: [
            { who: "시스템", type: "system", msg: "인수인계는 재발 방지의 핵심입니다." }
          ],
          timer: false,
          choices: [
            {
              text: "인수인계 완료(사진/절차/투입 로그)",
              tags: ["인수인계", "완료"],
              effects: { hazard: -3, compliance: +5, progress: +20, complaint: -2, boss: 0, crew: +1, grid: +2, negligence: -1 },
              riskMult: 0.96
            },
            {
              text: "기록 최소화 후 종료",
              tags: ["서류만", "위험"],
              effects: { hazard: +2, compliance: -3, progress: +22, complaint: 0, boss: 0, crew: -1, grid: -2, negligence: +3 },
              riskMult: 1.06
            }
          ]
        }
      ]
    }
  }
};
