<template>
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
</template>

<script>
import { getWeek, format } from 'date-format-parse';
import { chunk } from '../util/base';
import { getCalendar } from '../util/date';
import { getLocaleFieldValue } from '../locale';

export default {
  name: 'TableDate',
  inject: {
    translateFn: {
      default: () => getLocaleFieldValue,
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
    firstDayOfWeek() {
      return this.translateFn('formatLocale.firstDayOfWeek') || 0;
    },
    days() {
      const days = this.translateFn('days') || this.translateFn('formatLocale.weekdaysMin');
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
      return format(date, fmt, { locale: this.translateFn('formatLocale') });
    },
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
      return this.getWeek(date, this.translateFn('formatLocale'));
    },
  },
};
</script>
