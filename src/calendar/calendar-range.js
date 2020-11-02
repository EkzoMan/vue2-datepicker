import CalendarPanel from './calendar-panel';
import { getValidDate, isValidDate, isValidRangeDate, startOfMonth } from '../util/date';

export default {
  name: 'CalendarRange',
  components: { CalendarPanel },
  inject: {
    prefixClass: {
      default: 'mx',
    },
  },
  props: {
    ...CalendarPanel.props,
  },
  data() {
    return {
      innerValue: [],
      calendars: [],
    };
  },
  computed: {
    // Minimum difference between start and end calendars
    calendarMinDiff() {
      const map = {
        date: 1, // type:date  min 1 month
        month: 1 * 12, // type:month min 1 year
        year: 10 * 12, // type:year  min 10 year
      };
      return map[this.type] || map.date;
    },
    calendarMaxDiff() {
      return Infinity;
    },
    defaultValues() {
      return Array.isArray(this.defaultValue)
        ? this.defaultValue
        : [this.defaultValue, this.defaultValue];
    },
  },
  watch: {
    value: {
      immediate: true,
      handler() {
        this.innerValue = isValidRangeDate(this.value)
          ? this.value
          : [new Date(NaN), new Date(NaN)];
        this.calendars = this.innerValue.map((v, i) =>
          startOfMonth(getValidDate(v, this.defaultValues[i]))
        );
        this.validateCalendars(1);
      },
    },
  },
  methods: {
    handleSelect(date, type) {
      const [startValue, endValue] = this.innerValue;
      if (isValidDate(startValue) && !isValidDate(endValue)) {
        if (startValue.getTime() > date.getTime()) {
          this.innerValue = [date, startValue];
        } else {
          this.innerValue = [startValue, date];
        }
        this.emitDate(this.innerValue, type);
      } else {
        this.innerValue = [date, new Date(NaN)];
      }
    },
    emitDate(dates, type) {
      this.$emit('select', dates, type);
    },
    updateStartCalendar(value) {
      this.calendars.splice(0, 1, value);
      this.validateCalendars(1);
    },
    updateEndCalendar(value) {
      this.calendars.splice(1, 1, value);
      this.validateCalendars(0);
    },
    validateCalendars(index) {
      const gap = this.getCalendarGap();
      if (gap) {
        const calendar = new Date(this.calendars[index]);
        if (index === 0) {
          calendar.setMonth(calendar.getMonth() - gap);
        } else {
          calendar.setMonth(calendar.getMonth() + gap);
        }
        this.calendars.splice(index, 1, calendar);
      }
    },
    getCalendarGap() {
      const [calendarLeft, calendarRight] = this.calendars;
      const yearDiff = calendarRight.getFullYear() - calendarLeft.getFullYear();
      const monthDiff = calendarRight.getMonth() - calendarLeft.getMonth();
      const diff = yearDiff * 12 + monthDiff;
      const min = this.calendarMinDiff;
      const max = this.calendarMaxDiff;
      if (diff < min) {
        return min - diff;
      }
      if (diff > max) {
        return max - diff;
      }
      return 0;
    },
    getRangeClasses(cellDate, currentDates, classnames) {
      const classes = [].concat(this.getClasses(cellDate, currentDates, classnames));
      if (
        !/disabled|active|not-current-month/.test(classnames) &&
        currentDates.length === 2 &&
        cellDate.getTime() > currentDates[0].getTime() &&
        cellDate.getTime() < currentDates[1].getTime()
      ) {
        classes.push('in-range');
      }
      return classes;
    },
  },
  render() {
    const calendarRange = this.calendars.map((calendar, index) => {
      const props = {
        ...this.$props,
        calendar,
        value: this.innerValue,
        defaultValue: this.defaultValues[index],
        getClasses: this.getRangeClasses,
        // don't update when range is true
        partialUpdate: false,
      };
      const on = {
        select: this.handleSelect,
        'update:calendar': index === 0 ? this.updateStartCalendar : this.updateEndCalendar,
      };
      return <calendar-panel {...{ props, on }}></calendar-panel>;
    });

    const { prefixClass } = this;

    return <div class={`${prefixClass}-range-wrapper`}>{calendarRange}</div>;
  },
};
