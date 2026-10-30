import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MONTH_NAMES, formatDateKey } from '../dateUtils';
import { calculateMonthlyPnL } from '../calc';

export default function AnalyticsView({
  year,
  entries = {},
  selectedAccount = 'Main Account',
  accounts = ['Main Account', 'Trading'],
  currentDate = new Date(),
  theme,
}) {
  const [chartType, setChartType] = useState('All');

  // 1. MONTHLY P&L DATA
  const monthlyData = MONTH_NAMES.map((monthName, idx) => {
    const rawVal = calculateMonthlyPnL(entries, year, idx, selectedAccount);
    return {
      month: monthName.slice(0, 3),
      fullName: monthName,
      amount: Math.round(rawVal || 0),
    };
  });

  const maxMonthlyAbs = Math.max(...monthlyData.map((d) => Math.abs(d.amount)), 1);

  // 2. WEEKLY P&L DATA
  const getWeeklyBreakdown = () => {
    const monthIdx = currentDate.getMonth();
    const currYear = currentDate.getFullYear();
    const firstDayOfMonth = new Date(currYear, monthIdx, 1);
    const lastDayOfMonth = new Date(currYear, monthIdx + 1, 0);

    const weeks = [];
    let currentWeekStart = new Date(firstDayOfMonth);
    let weekNum = 1;

    while (currentWeekStart <= lastDayOfMonth) {
      let weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > lastDayOfMonth) weekEnd = new Date(lastDayOfMonth);

      let weekTotal = 0;
      let d = new Date(currentWeekStart);
      while (d <= weekEnd) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const y = d.getFullYear();
          const m = d.getMonth();
          const dateNum = d.getDate();
          const key = formatDateKey(y, m, dateNum);
          const entry = entries[key];
          if (entry) {
            const acc = entry.account || 'Main Account';
            if (selectedAccount === 'All' || acc === selectedAccount) {
              const amt = Math.round(parseFloat(entry.amount || 0));
              if (!isNaN(amt)) weekTotal += amt;
            }
          }
        }
        d.setDate(d.getDate() + 1);
      }

      weeks.push({
        label: 'W' + weekNum,
        range: currentWeekStart.getDate() + ' - ' + weekEnd.getDate() + ' ' + MONTH_NAMES[monthIdx].slice(0, 3),
        amount: Math.round(weekTotal),
      });

      weekNum++;
      currentWeekStart = new Date(weekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
    }

    return weeks;
  };

  const weeklyData = getWeeklyBreakdown();
  const maxWeeklyAbs = Math.max(...weeklyData.map((w) => Math.abs(w.amount)), 1);

  // 3. CUMULATIVE EQUITY TRAJECTORY
  const getCumulativeData = () => {
    const sortedKeys = Object.keys(entries).sort();
    let runningTotal = 0;
    const curve = [];

    sortedKeys.forEach((key) => {
      const parts = key.split('-').map(Number);
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const dateObj = new Date(y, m - 1, d);
        if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6) {
          const entry = entries[key];
          const acc = entry?.account || 'Main Account';
          if (selectedAccount === 'All' || acc === selectedAccount) {
            const amt = Math.round(parseFloat(entry?.amount || 0));
            if (!isNaN(amt)) {
              runningTotal += amt;
              curve.push({
                dateKey: key,
                label: d + '/' + m,
                total: runningTotal,
              });
            }
          }
        }
      }
    });

    if (curve.length > 10) {
      const step = Math.ceil(curve.length / 8);
      return curve.filter((_, idx) => idx % step === 0 || idx === curve.length - 1);
    }

    return curve;
  };

  const cumulativeData = getCumulativeData();
  const maxCumulativeAbs = Math.max(...cumulativeData.map((c) => Math.abs(c.total)), 1);

  // 4. ACCOUNT BREAKDOWN
  const getAccountBreakdown = () => {
    return accounts.map((accName) => {
      let accTotal = 0;
      let accProfits = 0;
      let accLosses = 0;

      Object.values(entries).forEach((entry) => {
        const acc = entry?.account || 'Main Account';
        if (acc === accName) {
          const amt = Math.round(parseFloat(entry?.amount || 0));
          if (!isNaN(amt)) {
            accTotal += amt;
            if (amt > 0) accProfits += amt;
            if (amt < 0) accLosses += Math.abs(amt);
          }
        }
      });

      return {
        name: accName,
        net: accTotal,
        profits: accProfits,
        losses: accLosses,
      };
    });
  };

  const accountData = getAccountBreakdown();

  // 5. OVERALL METRICS
  let profitDays = 0;
  let lossDays = 0;
  let totalProfitSum = 0;
  let totalLossSum = 0;
  let maxSingleProfit = 0;
  let maxSingleLoss = 0;

  Object.values(entries || {}).forEach((entry) => {
    const acc = entry?.account || 'Main Account';
    if (selectedAccount === 'All' || acc === selectedAccount) {
      const val = Math.round(parseFloat(entry?.amount || 0));
      if (val > 0) {
        profitDays++;
        totalProfitSum += val;
        if (val > maxSingleProfit) maxSingleProfit = val;
      } else if (val < 0) {
        lossDays++;
        totalLossSum += Math.abs(val);
        if (Math.abs(val) > maxSingleLoss) maxSingleLoss = Math.abs(val);
      }
    }
  });

  const totalEntries = profitDays + lossDays;
  const winRate = totalEntries > 0 ? Math.round((profitDays / totalEntries) * 100) : 0;
  const avgProfit = profitDays > 0 ? Math.round(totalProfitSum / profitDays) : 0;
  const avgLoss = lossDays > 0 ? Math.round(totalLossSum / lossDays) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Chart Filter Selector Bar */}
      <View style={[styles.filterBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        {['All', 'Monthly', 'Weekly', 'Equity', 'Accounts'].map((mode) => {
          const isActive = chartType === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.filterBtn,
                isActive && { backgroundColor: theme.accent },
              ]}
              onPress={() => setChartType(mode)}
            >
              <Text style={[styles.filterBtnText, { color: isActive ? '#FFF' : theme.textSecondary }]}>
                {mode}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* PERFORMANCE SUMMARY CARDS */}
      {(chartType === 'All' || chartType === 'Accounts') && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>⚡ Key Performance Indicators</Text>
          <View style={styles.grid}>
            <View style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Win Rate</Text>
              <Text style={[styles.statValue, { color: theme.accent }]}>{winRate}%</Text>
              <Text style={[styles.statSub, { color: theme.textSecondary }]}>{profitDays} Green / {lossDays} Red</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Logged</Text>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>{totalEntries} Days</Text>
              <Text style={[styles.statSub, { color: theme.textSecondary }]}>Weekday Entries</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.profitBg }]}>
              <Text style={[styles.statLabel, { color: theme.profitText }]}>Avg Green Day</Text>
              <Text style={[styles.statValue, { color: theme.profitText }]}>+₹{avgProfit}</Text>
              <Text style={[styles.statSub, { color: theme.profitText }]}>Best: +₹{maxSingleProfit}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.lossBg }]}>
              <Text style={[styles.statLabel, { color: theme.lossText }]}>Avg Red Day</Text>
              <Text style={[styles.statValue, { color: theme.lossText }]}>-₹{avgLoss}</Text>
              <Text style={[styles.statSub, { color: theme.lossText }]}>Worst: -₹{maxSingleLoss}</Text>
            </View>
          </View>

          {/* Win/Loss Distribution */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 12 }]}>
            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Win / Loss Distribution</Text>
            <View style={styles.gaugeBarBackground}>
              <View style={[styles.gaugeFillGreen, { width: winRate + '%', backgroundColor: theme.profitText }]} />
              <View style={[styles.gaugeFillRed, { width: (100 - winRate) + '%', backgroundColor: theme.lossText }]} />
            </View>
            <View style={styles.gaugeFooter}>
              <Text style={{ color: theme.profitText, fontSize: 12, fontWeight: '700' }}>🟢 Profits: {winRate}%</Text>
              <Text style={{ color: theme.lossText, fontSize: 12, fontWeight: '700' }}>🔴 Losses: {100 - winRate}%</Text>
            </View>
          </View>
        </>
      )}

      {/* GRAPH 1: MONTHLY P&L BAR CHART */}
      {(chartType === 'All' || chartType === 'Monthly') && (
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📅 Monthly P&L Trend ({year})</Text>
          <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.chartHeight}>
              {monthlyData.map((item, index) => {
                const heightPercent = Math.min((Math.abs(item.amount) / maxMonthlyAbs) * 100, 100);
                const isProfit = item.amount >= 0;
                let valDisplay = '';
                if (item.amount > 0) valDisplay = '+' + item.amount;
                else if (item.amount < 0) valDisplay = '' + item.amount;

                return (
                  <View key={index} style={styles.barColumn}>
                    <Text style={[styles.barValueText, { color: isProfit ? theme.profitText : theme.lossText }]}>
                      {valDisplay}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: item.amount === 0 ? '4%' : Math.max(heightPercent, 8) + '%',
                            backgroundColor: isProfit ? theme.profitText : theme.lossText,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* GRAPH 2: WEEKLY BREAKDOWN CHART */}
      {(chartType === 'All' || chartType === 'Weekly') && (
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            📆 Weekly Breakdown ({MONTH_NAMES[currentDate.getMonth()]})
          </Text>
          <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {weeklyData.map((item, index) => {
              const isProfit = item.amount >= 0;
              const barWidthPercent = Math.min((Math.abs(item.amount) / maxWeeklyAbs) * 100, 100);

              return (
                <View key={index} style={styles.horizontalBarRow}>
                  <View style={styles.horizontalLabelCol}>
                    <Text style={[styles.weekLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.weekRange, { color: theme.textSecondary }]}>{item.range}</Text>
                  </View>

                  <View style={styles.horizontalTrack}>
                    <View
                      style={[
                        styles.horizontalFill,
                        {
                          width: item.amount === 0 ? '2%' : Math.max(barWidthPercent, 6) + '%',
                          backgroundColor: isProfit ? theme.profitText : theme.lossText,
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.horizontalValue, { color: isProfit ? theme.profitText : theme.lossText }]}>
                    {item.amount >= 0 ? '+₹' + item.amount : '-₹' + Math.abs(item.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* GRAPH 3: CUMULATIVE EQUITY CURVE */}
      {(chartType === 'All' || chartType === 'Equity') && (
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📈 Cumulative Equity Trajectory</Text>
          <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {cumulativeData.length === 0 ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>
                No entries logged yet to render cumulative trajectory.
              </Text>
            ) : (
              <View style={styles.chartHeight}>
                {cumulativeData.map((item, index) => {
                  const isProfit = item.total >= 0;
                  const heightPercent = Math.min((Math.abs(item.total) / maxCumulativeAbs) * 100, 100);
                  const displayTotal = item.total >= 0 ? '+' + item.total : '' + item.total;

                  return (
                    <View key={index} style={styles.barColumn}>
                      <Text style={[styles.barValueText, { color: isProfit ? theme.profitText : theme.lossText }]}>
                        {displayTotal}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: Math.max(heightPercent, 10) + '%',
                              backgroundColor: isProfit ? theme.accent : theme.lossText,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {/* GRAPH 4: ACCOUNT-WISE BREAKDOWN */}
      {(chartType === 'All' || chartType === 'Accounts') && (
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>💼 Account-wise Performance</Text>
          <View style={{ gap: 10 }}>
            {accountData.map((acc) => (
              <View key={acc.name} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.accHeader}>
                  <Text style={[styles.accName, { color: theme.textPrimary }]}>{acc.name}</Text>
                  <Text style={[styles.accNet, { color: acc.net >= 0 ? theme.profitText : theme.lossText }]}>
                    {acc.net >= 0 ? '+₹' + acc.net : '-₹' + Math.abs(acc.net)}
                  </Text>
                </View>

                <View style={styles.accRow}>
                  <Text style={{ color: theme.profitText, fontSize: 12 }}>Profits: +₹{acc.profits}</Text>
                  <Text style={{ color: theme.lossText, fontSize: 12 }}>Losses: -₹{acc.losses}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  filterBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statSub: {
    fontSize: 11,
    marginTop: 4,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  gaugeBarBackground: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#21262D',
  },
  gaugeFillGreen: {
    height: '100%',
  },
  gaugeFillRed: {
    height: '100%',
  },
  gaugeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartSection: {
    marginTop: 16,
  },
  chartCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  chartHeight: {
    flexDirection: 'row',
    height: 170,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  barTrack: {
    width: 12,
    height: '75%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  horizontalBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  horizontalLabelCol: {
    width: 75,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  weekRange: {
    fontSize: 10,
  },
  horizontalTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  horizontalFill: {
    height: '100%',
    borderRadius: 5,
  },
  horizontalValue: {
    fontSize: 12,
    fontWeight: '700',
    width: 65,
    textAlign: 'right',
  },
  accHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  accName: {
    fontSize: 14,
    fontWeight: '700',
  },
  accNet: {
    fontSize: 15,
    fontWeight: '700',
  },
  accRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
