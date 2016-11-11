ALTER ROLE postgres PASSWORD 'password';
CREATE ROLE main_user LOGIN PASSWORD 'password';

CREATE SCHEMA todo;
GRANT USAGE ON SCHEMA todo TO main_user;

CREATE TABLE todo.rtodo (
	id serial,
	task text NOT NULL,
	complete smallint NOT NULL DEFAULT 0,
	change_login name DEFAULT "session_user"(),
    change_stamp timestamp with time zone DEFAULT date_trunc('second'::text, ('now'::text)::timestamp with time zone),
    create_stamp timestamp with time zone DEFAULT date_trunc('second'::text, ('now'::text)::timestamp with time zone),
    create_login character varying(200) DEFAULT "session_user"(),
	PRIMARY KEY (id)
) WITH (
	OIDS=FALSE
);

CREATE OR REPLACE FUNCTION todo.default_stamp_fn()
 	RETURNS trigger AS
$BODY$
DECLARE

BEGIN
	IF TG_OP = 'INSERT' THEN
		NEW.create_stamp := date_trunc('second',now());
		NEW.create_login := "session_user"();
	END IF;
	NEW.change_login := "session_user"();
	NEW.change_stamp := date_trunc('second',now());
	RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql
  VOLATILE;

ALTER FUNCTION todo.default_stamp_fn() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION todo.default_stamp_fn() TO postgres;

CREATE TRIGGER uc_trg_rtodo AFTER UPDATE
	ON todo.rtodo
	FOR EACH ROW
	EXECUTE PROCEDURE todo.default_stamp_fn();

CREATE VIEW todo.ttodo AS
	SELECT id, task, complete, create_login, change_stamp
		FROM todo.rtodo
		WHERE rtodo.create_login::name = "session_user"()
		ORDER BY id DESC;

GRANT SELECT, INSERT, UPDATE, DELETE ON todo.ttodo TO main_user;
GRANT ALL ON todo.rtodo_id_seq TO main_user;

-- DROP FUNCTION todo.action_todo(str_action text);

CREATE OR REPLACE FUNCTION todo.action_todo(str_action text)
  RETURNS text AS
$BODY$

BEGIN
	--remove all that are marked as complete
	IF str_action = 'clear_completed' THEN
		DELETE FROM todo.ttodo WHERE complete = '-1' AND create_login = SESSION_USER;

	--return the number of active items
	ELSIF str_action = 'number_items' THEN
		RETURN '"' || (SELECT count(*) FROM todo.ttodo WHERE complete = 0) || '"';

	--toggle complete
	ELSIF str_action = 'toggle_items' THEN

		-- if all are checked
		IF (SELECT count(*) FROM todo.ttodo WHERE complete = 0) = 0 THEN
			UPDATE todo.ttodo SET complete = 0 WHERE create_login = SESSION_USER;

		-- if all are unchecked
		ELSIF (SELECT count(*) FROM todo.ttodo WHERE complete = -1) = 0 THEN
			UPDATE todo.ttodo SET complete = -1 WHERE create_login = SESSION_USER;

		-- else (some are checked)
		ELSE
			UPDATE todo.ttodo SET complete = -1 WHERE create_login = SESSION_USER;
		END IF;


	ELSE
		RAISE EXCEPTION 'Action not valid.';
	END IF;

	RETURN '""';
END;

$BODY$
	LANGUAGE plpgsql
	VOLATILE;

ALTER FUNCTION todo.action_todo(str_action text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION todo.action_todo(str_action text) TO main_user;
