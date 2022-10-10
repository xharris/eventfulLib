import moment from "moment-timezone";
import { Eventful } from "types";

export const calendarFormat = {
  lastDay: "[Yesterday]",
  sameDay: "[Today]",
  nextDay: "[Tomorrow]",
  lastWeek: "[last] dddd",
  nextWeek: "dddd",
  sameElse: "L",
};
export const calendarFormatTime = {
  lastDay: "[Yesterday at] LT",
  sameDay: "[Today at] LT",
  nextDay: "[Tomorrow at] LT",
  lastWeek: "[last] dddd [at] LT",
  nextWeek: "dddd [at] LT",
  sameElse: "LT",
};

export const formatStart = (time: Eventful.Time) =>
  time.start
    ? moment(time.start.date).calendar(
        time.start?.allday ? calendarFormat : calendarFormatTime
      )
    : null;
