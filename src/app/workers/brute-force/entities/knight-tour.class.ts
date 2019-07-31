import { Board } from "../../../common/entities/board.class";
import { Knight } from "../../../common/entities/knight.class";
import { IMatrixCoordinate } from "../../../common/interfaces/matrix-coordinate.interface";
import { IBoard } from "../../../common/interfaces/board.interface";

/**
 * Knight's Tour search
 */
export class KnightTour {

    /**
     * creates Knight's Tour search with specified board
     * 
     * @param board chess board
     */
    constructor(board: Board) {
        if (!board)
            throw new Error('Board is not specified.');

        Knight.instance.board = board;
    }

    /**
     * searches for the Knight's Tour
     */
    search() {
        const lastMove = Knight.instance.findLastMove();
        const moveNumber = Knight.instance.board.cells[lastMove.row][lastMove.column];

        this.foundSolutions = [];
        this.searchKnightTour(lastMove, moveNumber);

    }

    private foundSolutions: IBoard[];

    /**
     * searches for the Knight's Tour based on the last move of the knight
     * 
     * @param lastMoveCoordinate move coordinate
     * @param lastMoveNumber move number
     */
    private searchKnightTour(lastMoveCoordinate: IMatrixCoordinate, lastMoveNumber: number): IBoard {
        const maxMovesCount = Knight.instance.maxCountOfMoves;

        if (lastMoveNumber === maxMovesCount - 1) {
            return Knight.instance.board.asJSON();
        } else {
            const availableMoves = Knight.instance.findAllAvailableMoves(lastMoveCoordinate);
            for (let i = 0; i < availableMoves.length; i++) {
                const newMove = availableMoves[i];
                const newMoveNumber = lastMoveNumber + 1;

                Knight.instance.takeMove(newMove, newMoveNumber);

                const result = this.searchKnightTour(newMove, newMoveNumber);
                if (result) {
                    this.foundSolutions.push(result);
                    console.log(result);
                }

                Knight.instance.untakeMove(newMove);
            }
        }

        return null;
    }

}
