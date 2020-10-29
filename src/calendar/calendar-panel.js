import {
  subMonths,
  addMonths,
  subYears,
  addYears,
  setMonth,
  setYear,
  startOfYear,
  startOfMonth,
  startOfDay,
} from 'date-fns';
import { getValidDate, isValidDate, createDate } from '../util/date';
import TableDate from './table-date';
import TableMonth from './table-month';
import TableYear from './table-year';

export default {
  name: 'CalendarPanel',
  inject: {
    prefixClass: {
      default: 'mx',
    },
    dispatchDatePicker: {
      default: () => () => {},
    },
  },
  props: {
    value: {},
    defaultValue: {
      default() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
      },
    },
    defaultPanel: {
      type: String,
    },
    disabledDate: {
      type: Function,
      default: () => false,
    },
    type: {
      type: String,
      default: 'date',
    },
    getClasses: {
      type: Function,
      default: () => [],
    },
    showWeekNumber: {
      type: Boolean,
      default: undefined,
    },
    titleFormat: {
      type: String,
      default: 'YYYY-MM-DD',
    },
    calendar: Date,
    // update date when select year or month
    partialUpdate: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const panels = ['date', 'month', 'year'];
    const index = Math.max(panels.indexOf(this.type), panels.indexOf(this.defaultPanel));
    const panel = index !== -1 ? panels[index] : 'date';
    return {
      panel,
      innerCalendar: new Date(),
    };
  },
  computed: {
    innerValue() {
      const value = Array.isArray(this.value) ? this.value : [this.value];
      const map = {
        year: startOfYear,
        month: startOfMonth,
        date: startOfDay,
      };
      const start = map[this.type] || map.date;
      return value.filter(isValidDate).map(v => start(v));
    },
    calendarYear() {
      return this.innerCalendar.getFullYear();
    },
    calendarMonth() {
      return this.innerCalendar.getMonth();
    },
  },
  watch: {
    value: {
      immediate: true,
      handler: 'initCalendar',
    },
    calendar: {
      handler: 'initCalendar',
    },
    defaultValue: {
      handler: 'initCalendar',
    },
  },
  methods: {
    initCalendar() {
      let calendarDate = this.calendar;
      if (!isValidDate(calendarDate)) {
        const { length } = this.innerValue;
        calendarDate = getValidDate(length > 0 ? this.innerValue[length - 1] : this.defaultValue);
      }
      this.innerCalendar = calendarDate;
    },
    isDisabled(date) {
      return this.disabledDate(new Date(date), this.innerValue);
    },
    emitDate(date, type) {
      if (!this.isDisabled(date)) {
        this.$emit('select', date, type, this.innerValue);
        // someone need get the first selected date to set range value. (#429)
        this.dispatchDatePicker('pick', date, type);
      }
    },
    updateCalendar(date, type) {
      const oldValue = new Date(this.innerCalendar);
      this.innerCalendar = date;
      this.$emit('update:calendar', date);
      this.dispatchDatePicker('calendar-change', date, oldValue, type);
    },
    handelPanelChange(panel) {
      this.panel = panel;
    },
    handleLastMonth() {
      const nextCalendar = subMonths(this.innerCalendar, 1);
      this.updateCalendar(nextCalendar, 'last-month');
    },
    handleNextMonth() {
      const nextCalendar = addMonths(this.innerCalendar, 1);
      this.updateCalendar(nextCalendar, 'next-month');
    },
    handleLastYear() {
      const nextCalendar = subYears(this.innerCalendar, 1);
      this.updateCalendar(nextCalendar, 'last-year');
    },
    handleNextYear() {
      const nextCalendar = addYears(this.innerCalendar, 1);
      this.updateCalendar(nextCalendar, 'next-year');
    },
    handleLastDecade() {
      const nextCalendar = subYears(this.innerCalendar, 10);
      this.updateCalendar(nextCalendar, 'last-decade');
    },
    handleNextDecade() {
      const nextCalendar = addYears(this.innerCalendar, 10);
      this.updateCalendar(nextCalendar, 'next-decade');
    },
    handleSelectYear(year) {
      if (this.type === 'year') {
        const date = this.getYearCellDate(year);
        this.emitDate(date, 'year');
      } else {
        const nextCalendar = setYear(this.innerCalendar, year);
        this.updateCalendar(nextCalendar, 'year');
        this.handelPanelChange('month');
        if (this.partialUpdate && this.innerValue.length === 1) {
          const date = setYear(this.innerValue[0], year);
          this.emitDate(date, 'year');
        }
      }
    },
    handleSelectMonth(month) {
      if (this.type === 'month') {
        const date = this.getMonthCellDate(month);
        this.emitDate(date, 'month');
      } else {
        const nextCalendar = setMonth(this.innerCalendar, month);
        this.updateCalendar(nextCalendar, 'month');
        this.handelPanelChange('date');
        if (this.partialUpdate && this.innerValue.length === 1) {
          const date = setMonth(setYear(this.innerValue[0], this.calendarYear), month);
          this.emitDate(date, 'month');
        }
      }
    },
    handleSelectDate(date) {
      this.emitDate(date, this.type === 'week' ? 'week' : 'date');
    },
    getMonthCellDate(month) {
      return createDate(this.calendarYear, month);
    },
    getYearCellDate(year) {
      return createDate(year, 0);
    },
    getDateClasses(cellDate) {
      const notCurrentMonth = cellDate.getMonth() !== this.calendarMonth;
      const classes = [];
      if (cellDate.getTime() === new Date().setHours(0, 0, 0, 0)) {
        classes.push('today');
      }
      if (notCurrentMonth) {
        classes.push('not-current-month');
      }
      const state = this.getStateClass(cellDate);
      if (!(state === 'active' && notCurrentMonth)) {
        classes.push(state);
      }
      return classes.concat(this.getClasses(cellDate, this.innerValue, classes.join(' ')));
    },
    getMonthClasses(month) {
      if (this.type !== 'month') {
        return this.calendarMonth === month ? 'active' : '';
      }
      const classes = [];
      const cellDate = this.getMonthCellDate(month);
      classes.push(this.getStateClass(cellDate));
      return classes.concat(this.getClasses(cellDate, this.innerValue, classes.join(' ')));
    },
    getYearClasses(year) {
      if (this.type !== 'year') {
        return this.calendarYear === year ? 'active' : '';
      }
      const classes = [];
      const cellDate = this.getYearCellDate(year);
      classes.push(this.getStateClass(cellDate));
      return classes.concat(this.getClasses(cellDate, this.innerValue, classes.join(' ')));
    },
    getStateClass(cellDate) {
      if (this.isDisabled(cellDate)) {
        return 'disabled';
      }
      if (this.innerValue.some(v => v.getTime() === cellDate.getTime())) {
        return 'active';
      }
      return '';
    },
    getWeekState(row) {
      if (this.type !== 'week') return '';
      const start = row[0].getTime();
      const end = row[6].getTime();
      const active = this.innerValue.some(v => {
        const time = v.getTime();
        return time >= start && time <= end;
      });
      return active ? `${this.prefixClass}-active-week` : '';
    },
  },
  render() {
    const { panel, innerCalendar } = this;
    if (panel === 'year') {
      return (
        <TableYear
          calendar={innerCalendar}
          getCellClasses={this.getYearClasses}
          on-select={this.handleSelectYear}
          on-last-decade={this.handleLastDecade}
          on-next-decade={this.handleNextDecade}
        />
      );
    }
    if (panel === 'month') {
      return (
        <TableMonth
          calendar={innerCalendar}
          getCellClasses={this.getMonthClasses}
          on-select={this.handleSelectMonth}
          on-change-panel={this.handelPanelChange}
          on-last-year={this.handleLastYear}
          on-next-year={this.handleNextYear}
        />
      );
    }
    return (
      <TableDate
        class={{ [`${this.prefixClass}-calendar-week-mode`]: this.type === 'week' }}
        calendar={innerCalendar}
        getCellClasses={this.getDateClasses}
        getRowClasses={this.getWeekState}
        titleFormat={this.titleFormat}
        showWeekNumber={
          typeof showWeekNumber === 'boolean' ? this.showWeekNumber : this.type === 'week'
        }
        on-select={this.handleSelectDate}
        on-change-panel={this.handelPanelChange}
        on-last-year={this.handleLastYear}
        on-next-year={this.handleNextYear}
        on-last-month={this.handleLastMonth}
        on-next-month={this.handleNextMonth}
      />
    );
  },
};
