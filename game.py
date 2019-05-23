
class State:
    @staticmethod
    def pack(ismyturn, m1, m2, o1, o2):
        assert 0 <= m1 < 5 and 0 <= m2 < 5
        assert 0 <= o1 < 5 and 0 <= o2 < 5
        m1,m2 = min(m1,m2),max(m1,m2)
        o1,o2 = min(o1,o2),max(o1,o2)
        s = m1 * 125 + m2 * 25 + o1 * 5 + o2
        return s + 625 if ismyturn else s

    def __init__(self, ismyturn, m1, m2, o1, o2):
        self.s = State.pack(ismyturn, m1, m2, o1, o2)
        self.succ = []
        # outcome: positive: win; 0: unknown; negative: lose
        if m1 == m2 == 0:
            self.outcome = -1000000
        elif o1 == o2 == 0:
            self.outcome = 1000000
        else:
            self.outcome = 0

    def ismyturn(self):
        return self.s >= 625

    def unpack(self):
        return self.s >= 625, (self.s // 125) % 5, (self.s // 25) % 5, (self.s // 5) % 5, self.s % 5

    def to_string(self):
        ismyturn, m1, m2, o1, o2 = self.unpack()
        if ismyturn:
            return "me*: {},{}; op: {},{}".format(m1, m2, o1, o2)
        else:
            return "me: {},{}; op*: {},{}".format(m1, m2, o1, o2)

    def to_string2(self):
        ismyturn, m1, m2, o1, o2 = self.unpack()
        outcome = self.outcome
        if not ismyturn:
            m1, m2, o1, o2 = o1, o2, m1, m2
            outcome = -outcome
        s = 'D' if outcome == 0 else ('W' if outcome > 0 else 'L')
        return '{}{}{}{}{}'.format(s, m1, m2, o1, o2)

# rule_claploop
# 0: only allow different result e.g. 2,0->1,1
# 1: allow 1,2->2,1
# 2: allow 2,2->2,2
def clap(left, right, rule_claploop):
    result = list()
    for i in range(1,5):
        if i >= left + right: break
        j = left + right - i
        if j >= 5: continue
        if rule_claploop < 2 and left == i == j: continue
        if rule_claploop < 1 and (left == i or left == j) : continue
        result.append((i, left + right - i))
    return result

def tap_result(a, b, rule_exact5):
    if a + b < 5:
        return a + b
    elif rule_exact5:
        return a + b - 5
    else:
        return 0

# assuming ismyturn
def tap(m1, m2, o1, o2, rule_exact5):
    result = list()
    if m1 and o1:
        result.append((tap_result(m1, o1, rule_exact5), o2))
    if m1 and o2:
        result.append((o1, tap_result(m1, o2, rule_exact5)))
    if m2 and o1:
        result.append((tap_result(m2, o1, rule_exact5), o2))
    if m2 and o2:
        result.append((o1, tap_result(m2, o2, rule_exact5)))
    return result

def main():
    # game rules:
    rule_exact5 = False
    rule_claploop = 0
    rule_tapself = True

    # enumerate all states
    states = dict()
    for ismyturn in [False, True]:
        for i in range(0,625):
            m1, m2, o1, o2 = (i // 125) % 5, (i // 25) % 5, (i // 5) % 5, i % 5
            state = State(ismyturn, m1, m2, o1, o2)
            states[state.s] = state

    # build State.succ
    for state in states.values():
        #print(state.to_string())
        ismyturn, m1, m2, o1, o2 = state.unpack()
        succ = set()
        # clap:
        if ismyturn:
            for left, right in clap(m1, m2, rule_claploop):
                succ.add(State.pack(not ismyturn, left, right, o1, o2))
        else:
            for left, right in clap(o1, o2, rule_claploop):
                succ.add(State.pack(not ismyturn, m1, m2, left, right))
        # tap:
        if ismyturn:
            for left, right in tap(m1, m2, o1, o2, rule_exact5):
                succ.add(State.pack(not ismyturn, m1, m2, left, right))
            if rule_tapself and m1 and m2:
                succ.add(State.pack(not ismyturn, m1, tap_result(m1, m2, rule_exact5), o1, o2))
                succ.add(State.pack(not ismyturn, tap_result(m1, m2, rule_exact5), m2, o1, o2))
        else:
            for left, right in tap(o1, o2, m1, m2, rule_exact5):
                succ.add(State.pack(not ismyturn, left, right, o1, o2))
            if rule_tapself and o1 and o2:
                succ.add(State.pack(not ismyturn, m1, m2, o1, tap_result(o1, o2, rule_exact5)))
                succ.add(State.pack(not ismyturn, m1, m2, tap_result(o1, o2, rule_exact5), o2))
        state.succ = [states[s] for s in succ]
        #for s in state.succ:
        #    print('  ' + s.to_string())

    # search backward
    # a state is winning if
    #   (1) it's my turn and has one winning successor ; or
    #   (2) it's opponent's turn and all successors are winning
    # a state is losing if
    #   (1) it's opponent's turn and has one losing successor ; or
    #   (2) it's my turn and all successors are losing
    while True:
        updated = False
        for state in states.values():
            if state.outcome != 0: continue
            if state.ismyturn():
                best = max([s.outcome for s in state.succ])
                if best > 0:
                    state.outcome = best - 1
                    updated = True
                elif best < 0:
                    state.outcome = best + 1
                    updated = True
            else:
                worst = min([s.outcome for s in state.succ])
                if worst > 0:
                    state.outcome = worst - 1
                    updated = True
                elif worst < 0:
                    state.outcome = worst + 1
                    updated = True
        if not updated: break

    order_state = sorted(list(states.keys()))
    i = 0
    for state in [states[s] for s in order_state]:
        if not state.ismyturn(): continue
        #if state.outcome == 1000000 or state.outcome == -1000000: continue
        def outcome(o):
            if o == 0: return 'draw'
            return 'win ' + str(1000000 - o) if o > 0 else 'lose ' + str(1000000 + o)
        #print(state.to_string() + ' ' + outcome(state.outcome))
        #for s in state.succ:
        #    print('  ' + s.to_string() + ' ' + outcome(s.outcome))
        #best = max(state.succ, key=lambda s : s.outcome)
        #print(state.to_string2() + ' -> ' + best.to_string2() + ';')

        ismyturn, m1, m2, o1, o2 = state.unpack()
        print('{}: {},'.format(m1*1000+m2*100+o1*10+o2, (state.outcome - 999901) if state.outcome > 0 else (state.outcome + 999901)))
        i += 1
        if i % 10 == 0:
            print('NL')

if __name__ == "__main__":
    main()
