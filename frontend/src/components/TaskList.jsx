import { useState } from "react";

export default function TaskList({
  t,
  tasks,
  loading,
  busyId,
  updateTaskState,
  deleteTask,
  priorityLabel,
  recurringLabel,
  setSelectedFiles,
  selectedFiles,
  uploadAttachment,
  uploadingTaskId,
  downloadAttachment,
  removeAttachment,
}) {
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  return (
    <section className="task-list">
      {!loading && tasks.length === 0 ? <p className="empty-state">{t.noTasks}</p> : null}

      {tasks.map((task) => (
        <article
          key={task.id}
          className={`task-card ${task.done ? "done" : ""} ${expandedTaskId === task.id ? "expanded" : "collapsed"}`}
          onClick={() => setExpandedTaskId((prev) => (prev === task.id ? null : task.id))}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpandedTaskId((prev) => (prev === task.id ? null : task.id));
            }
          }}
        >
          <button
            className="task-check status-badge"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              updateTaskState(task.id, { done: !task.done });
            }}
            disabled={busyId === task.id}
          >
            {task.done ? t.statusDone : t.open}
          </button>

          <div className="task-content">
            <p>{task.title}</p>
            <small>
              {task.start_date} - {task.end_date}
            </small>

            <div className="task-meta">
              <span className={`chip chip-${task.priority}`}>{priorityLabel[task.priority]}</span>
              <span className="chip">{recurringLabel[task.recurring]}</span>
              {task.tags.map((tag) => (
                <span key={tag} className="chip tag-chip">
                  #{tag}
                </span>
              ))}
            </div>

            {expandedTaskId === task.id ? (
              <>
                {task.notes ? <p className="task-notes">{task.notes}</p> : null}

                <div className="attachments" onClick={(event) => event.stopPropagation()}>
                  <strong>{t.attachments}</strong>
                  <div className="file-row">
                    <input
                      id={`task-file-${task.id}`}
                      className="file-input-hidden"
                      type="file"
                      onChange={(e) =>
                        setSelectedFiles((prev) => ({
                          ...prev,
                          [task.id]: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    <label htmlFor={`task-file-${task.id}`} className="file-picker-btn">
                      {t.selectFile}
                    </label>
                    <span className="selected-file-name">{selectedFiles[task.id]?.name || t.noFileSelected}</span>
                    <button
                      type="button"
                      onClick={() => uploadAttachment(task.id)}
                      disabled={uploadingTaskId === task.id || !selectedFiles[task.id]}
                    >
                      {t.upload}
                    </button>
                  </div>

                  {task.attachments.length === 0 ? <small>{t.noFiles}</small> : null}
                  {task.attachments.map((attachment) => (
                    <div key={attachment.id} className="attachment-item">
                      <span>{attachment.file_name}</span>
                      <div>
                        <button type="button" onClick={() => downloadAttachment(attachment)}>
                          {t.downloading}
                        </button>
                        <button type="button" onClick={() => removeAttachment(attachment.id)}>
                          {t.removeFile}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <button
            className="task-delete"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              deleteTask(task.id);
            }}
            disabled={busyId === task.id}
          >
            {t.delete}
          </button>
        </article>
      ))}
    </section>
  );
}
