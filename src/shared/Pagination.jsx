import { FiChevronsLeft, FiChevronLeft, FiChevronRight, FiChevronsRight } from "react-icons/fi";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-between items-center mt-4">
      {/* Page info */}
      <div className="text-sm text-base-content/70">
        Pages {currentPage}/{totalPages}
      </div>

      {/* Pagination buttons */}
      <div className="join">
        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <FiChevronsLeft size={16} />
        </button>

        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FiChevronLeft size={16} />
        </button>

        {/* Current page button */}
        <button className="join-item btn btn-sm btn-error">
          <span className="px-1">{currentPage}</span> of <span className="px-1">{totalPages}</span>
        </button>

        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FiChevronRight size={16} />
        </button>

        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <FiChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;