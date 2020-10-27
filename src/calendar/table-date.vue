<template>
  <div>
    <div :class="`${prefixClass}-calendar-header`">
      <button
        type="button"
        :class="`${prefixClass}-btn ${prefixClass}-btn-text ${prefixClass}-btn-icon-double-left`"
        @click="handleIconDoubleLeftClick"
      >
        <i :class="`${prefixClass}-icon-double-left`"></i>
      </button>
      <button
        type="button"
        :class="`${prefixClass}-btn ${prefixClass}-btn-text ${prefixClass}-btn-icon-left`"
        @click="handleIconLeftClick"
      >
        <i :class="`${prefixClass}-icon-left`"></i>
      </button>
      <button
        type="button"
        :class="`${prefixClass}-btn ${prefixClass}-btn-text ${prefixClass}-btn-icon-double-right`"
        @click="handleIconDoubleRightClick"
      >
        <i :class="`${prefixClass}-icon-double-right`"></i>
      </button>
      <button
        type="button"
        :class="`${prefixClass}-btn ${prefixClass}-btn-text ${prefixClass}-btn-icon-right`"
        @click="handleIconRightClick"
      >
        <i :class="`${prefixClass}-icon-right`"></i>
      </button>
      <span :class="`${prefixClass}-calendar-header-label`">
        <button
          v-for="item in yearMonth"
          :key="item.panel"
          type="button"
          :class="
            `${prefixClass}-btn ${prefixClass}-btn-text ${prefixClass}-btn-current-${item.panel}`
          "
          @click="handelPanelChange(item.panel)"
        >
          {{ item.label }}
        </button>
      </span>
    </div>
    <div :class="`${prefixClass}-calendar-content`">
      <table :class="`${prefixClass}-table ${prefixClass}-table-date`">
        <thead>
          <tr>
            <th v-if="showWeekNumber" :class="`${prefixClass}-week-number-header`"></th>
            <th v-for="day in days" :key="day">{{ day }}</th>
          </tr>
        </thead>
        <tbody @click="handleCellClick">
          <tr
            v-for="(row, i) in dates"
            :key="i"
            :class="[`${prefixClass}-date-row`, getRowClasses(row)]"
          >
            <td v-if="showWeekNumber" :class="`${prefixClass}-week-number`">
              {{ getWeekNumber(row[0]) }}
            </td>
            <td
              v-for="(cell, j) in row"
              :key="j"
              :data-date="cell.getTime()"
              class="cell"
              :class="getCellClasses(cell)"
              :title="getCellTitle(cell)"
            >
              <div>{{ cell.getDate() }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { getWeek, format } from 'date-format-parse';
import { chunk } from '../util/base';
import { getCalendar } from '../util/date';
import { getLocale } from '../locale';

export default {
  name: 'TableDate',
  inject: {
    locale: {
      default: getLocale,
    },
    getWeek: {
      default: () => getWeek,
    },
    prefixClass: {
      default: 'mx',
    },
  },
  props: {
    calendarYear: {
      type: Number,
      default() {
        return new Date().getFullYear();
      },
    },
    calendarMonth: {
      type: Number,
      default() {
        return new Date().getMonth();
      },
    },
    showWeekNumber: {
      type: Boolean,
      default: false,
    },
    titleFormat: {
      type: String,
      default: 'YYYY-MM-DD',
    },
    getRowClasses: {
      type: Function,
      default() {
        return [];
      },
    },
    getCellClasses: {
      type: Function,
      default() {
        return [];
      },
    },
  },
  computed: {
    yearMonth() {
      const { yearFormat, monthBeforeYear, monthFormat = 'MMM' } = this.locale;
      const yearLabel = {
        panel: 'year',
        label: this.formatDate(this.innerCalendar, yearFormat),
      };
      const monthLabel = {
        panel: 'month',
        label: this.formatDate(this.innerCalendar, monthFormat),
      };
      return monthBeforeYear ? [monthLabel, yearLabel] : [yearLabel, monthLabel];
    },
    firstDayOfWeek() {
      return this.locale.formatLocale.firstDayOfWeek || 0;
    },
    days() {
      const days = this.locale.days || this.locale.formatLocale.weekdaysMin;
      return days.concat(days).slice(this.firstDayOfWeek, this.firstDayOfWeek + 7);
    },
    dates() {
      const arr = getCalendar({
        firstDayOfWeek: this.firstDayOfWeek,
        year: this.calendarYear,
        month: this.calendarMonth,
      });
      return chunk(arr, 7);
    },
  },
  methods: {
    formatDate(date, fmt) {
      return format(date, fmt, { locale: this.locale.formatLocale });
    },
    handlePanelChange() {},
    handleCellClick(evt) {
      let { target } = evt;
      if (target.tagName === 'DIV') {
        target = target.parentNode;
      }
      const date = target.getAttribute('data-date');
      if (date) {
        this.$emit('select', new Date(parseInt(date, 10)));
      }
    },
    getCellTitle(date) {
      const fmt = this.titleFormat;
      return this.formatDate(date, fmt);
    },
    getWeekNumber(date) {
      return this.getWeek(date, this.locale.formatLocale);
    },
  },
};
</script>
