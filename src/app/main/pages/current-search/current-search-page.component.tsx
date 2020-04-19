import * as React from "react";
import { Redirect } from "react-router-dom";

import BruteForceWorker from "worker-loader!../../../workers/brute-force";

import { urlFragments } from "../../constants/url-fragments";
import { labels } from "../../constants/labels";

import { BreadcrumbProps } from "../../shared/breadcrumb/breadcrumb-props.interface";
import { CurrentSearchPageProps } from "./current-search-page-props.interface";
import { CurrentSearchPageState } from "./current-search-page-state.interface";

import { Algorithms } from "../../../common/enums/algorithms.enum";
import { MainActions } from "../../../common/enums/main-actions.enum";
import { MainNotifications } from "../../../common/enums/main-notifications.enum";

import { BoardInfoProps } from "./board-info/board-info-props.interface";
import { SearchInfoProps } from "./search-info/search-info-props.interface";
import { IPrepareMainSearchMessage } from "../../../common/interfaces/main-messages/actions/prepare-main-search-message.interface";
import { IStartMainSearchMessage } from "../../../common/interfaces/main-messages/actions/start-main-search-message.interface";
import { IStopMainSearchMessage } from "../../../common/interfaces/main-messages/actions/stop-main-search-message.interface";

import { IMainNotificationMessage } from "../../../common/interfaces/main-messages/notifications/main-notification-message.interface";
import { IMainSearchPreparedMessage } from "../../../common/interfaces/main-messages/notifications/main-search-prepared-message.interface";
import { IMainSearchStartedMessage } from "../../../common/interfaces/main-messages/notifications/main-search-started-message.interface";
import { IMainSearchReportMessage } from "../../../common/interfaces/main-messages/notifications/main-search-report-message.interface";
import { IMainSearchStoppedMessage } from "../../../common/interfaces/main-messages/notifications/main-search-stopped-message.interface";

import { BreadcrumbComponent } from "../../shared/breadcrumb/breadcrumb.component";
import { SearchInfo } from "./search-info/search-info.component";
import { BoardInfo } from "./board-info/board-info.component";

const REPORT_INTERVAL = 50;

export class CurrentSearchPage extends React.Component<
  CurrentSearchPageProps,
  CurrentSearchPageState
> {
  state: CurrentSearchPageState = {
    prepared: false,
    started: false,
    completed: false,
    breadcrumb: {
      items: [],
    },
    searchInfo: {
      solutionsFound: 0,
      movesTaken: 0,
      algorithm: Algorithms.BruteForce,
    },
    boardInfoItems: [],
  };

  private _mainWorker: BruteForceWorker;

  componentDidMount() {
    this.setBreadcrumb();
    this.initMainWorker();

    if (this.props.fullSearchInfo) {
      this.prepareSearch();
    }
  }

  componentWillUnmount() {
    if (this._mainWorker) {
      this._mainWorker.terminate();
    }
  }

  render() {
    if (!this.props.fullSearchInfo) {
      return <Redirect to={`/${urlFragments.newSearch}`} />;
    }

    return (
      <div>
        <BreadcrumbComponent items={this.state.breadcrumb.items} />
        <div className="container">
          <h2>Current Search</h2>
          <SearchInfo {...this.state.searchInfo} />
          <div>
            <button className="btn btn-primary" type="button">
              Show Random Solution
            </button>
            <button
              className="btn btn-success ml-2"
              type="button"
              disabled={!this.state.prepared || this.state.started}
              onClick={this.handleStarthButtonClick}
            >
              Start
            </button>
            <button
              className="btn btn-danger ml-2"
              type="button"
              disabled={!this.state.started || this.state.completed}
              onClick={this.handleStopButtonClick}
            >
              Stop
            </button>
          </div>
          <div className="d-flex flex-wrap justify-content-between mt-4">
            {this.state.boardInfoItems.map((item, index) => (
              <BoardInfo key={index} {...item} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  handleStarthButtonClick = () => {
    if (!this.state.prepared) {
      this.prepareSearch();
    }

    this.startSearch();
  };

  handleStopButtonClick = () => {
    this.stopSearch();
  };

  private setBreadcrumb() {
    const partialState: { breadcrumb: BreadcrumbProps } = {
      breadcrumb: {
        items: [
          {
            to: `/${urlFragments.home}`,
            label: labels.home,
          },
          {
            to: `/${urlFragments.currentSearch}`,
            label: labels.currentSearch,
          },
        ],
      },
    };

    const state: CurrentSearchPageState = {
      ...this.state,
      ...partialState,
    };

    this.setState(state);
  }

  private initMainWorker() {
    this._mainWorker = new BruteForceWorker();

    this._mainWorker.onmessage = (ev) => {
      const evData = ev.data as IMainNotificationMessage;

      switch (evData.type) {
        case MainNotifications.SearchPrepared:
          this.searchPreparedHandler(evData as IMainSearchPreparedMessage);
          break;
        case MainNotifications.SearchStarted:
          this.searchStartedHandler(evData as IMainSearchStartedMessage);
          break;
        case MainNotifications.SearchReport:
          this.searchReportHandler(evData as IMainSearchReportMessage);
          break;
        case MainNotifications.SearchStopped:
          this.searchStoppedHandler(evData as IMainSearchStoppedMessage);
          break;
      }
    };
  }

  private searchPreparedHandler(data: IMainSearchPreparedMessage) {
    const boardInfoItems = data.boardsPerThread.map((board) => {
      const result: BoardInfoProps = {
        solutionsFound: 0,
        movesTaken: 0,
        board,
      };

      return result;
    });

    const newState: CurrentSearchPageState = {
      ...this.state,
      boardInfoItems,
      prepared: true,
    };

    this.setState(newState);
  }

  private searchStartedHandler(data: IMainSearchStartedMessage) {
    const newState: CurrentSearchPageState = {
      ...this.state,
      started: true,
    };

    this.setState(newState);
  }

  private searchReportHandler(data: IMainSearchReportMessage) {
    const searchInfo: SearchInfoProps = {
      solutionsFound: data.totalSolutionsFound,
      movesTaken: data.totalMovesTaken,
      algorithm: Algorithms.BruteForce,
    };

    const boardInfoItems = data.boardsPerThread.map((board, index) => {
      const result: BoardInfoProps = {
        solutionsFound: data.solutionsFoundCountPerThread[index],
        movesTaken: data.movesTakenCountPerThread[index],
        board,
      };

      return result;
    });

    const newState: CurrentSearchPageState = {
      ...this.state,
      searchInfo,
      boardInfoItems,
    };

    this.setState(newState);
  }

  private searchStoppedHandler(data: IMainSearchStoppedMessage) {
    if (data.lastReport) {
      this.searchReportHandler(data.lastReport);
    }

    const newState: CurrentSearchPageState = {
      ...this.state,
      completed: true,
    };

    this.setState(newState);
  }

  private prepareSearch() {
    const message: IPrepareMainSearchMessage = {
      type: MainActions.SearchPrepare,
      board: this.props.fullSearchInfo.firstMoveBoard,
      countOfThreads: this.props.fullSearchInfo.maxCountOfThreads,
    };

    this._mainWorker.postMessage(message);
  }

  private startSearch() {
    const message: IStartMainSearchMessage = {
      type: MainActions.SearchStart,
      reportInterval: REPORT_INTERVAL,
    };

    this._mainWorker.postMessage(message);
  }

  private stopSearch() {
    const message: IStopMainSearchMessage = {
      type: MainActions.SearchStop,
    };

    this._mainWorker.postMessage(message);
  }
}
